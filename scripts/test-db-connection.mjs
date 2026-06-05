import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true);

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const pgSslMode = process.env.PGSSLMODE;

function getRawCredentials(url) {
  const schemeMarker = "://";
  const schemeIndex = url.indexOf(schemeMarker);
  if (schemeIndex === -1) {
    return { username: "", password: "" };
  }

  const afterScheme = url.slice(schemeIndex + schemeMarker.length);
  const atIndex = afterScheme.lastIndexOf("@");
  if (atIndex === -1) {
    return { username: "", password: "" };
  }

  const userInfo = afterScheme.slice(0, atIndex);
  const colonIndex = userInfo.indexOf(":");
  if (colonIndex === -1) {
    return { username: userInfo, password: "" };
  }

  return {
    username: userInfo.slice(0, colonIndex),
    password: userInfo.slice(colonIndex + 1)
  };
}

function hasInvalidPercentEncoding(value) {
  const percentMatches = value.match(/%(?![0-9A-Fa-f]{2})/g);
  return Boolean(percentMatches?.length);
}

function getUrlBreakingPasswordSymbols(rawPassword) {
  const symbols = ["@", "#", ":", "/", "?", "&"];
  const found = symbols.filter((symbol) => rawPassword.includes(symbol));

  if (rawPassword.includes("%")) {
    found.push(
      hasInvalidPercentEncoding(rawPassword)
        ? "% (invalid percent encoding)"
        : "% (appears percent-encoded)"
    );
  }

  return found;
}

function inferSupabaseConnection(parsedUrl, rawUsername) {
  const host = parsedUrl.hostname;
  const username = decodeURIComponent(rawUsername || parsedUrl.username);

  if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
    return {
      type: "direct",
      expectedPort: "5432",
      expectedUsername: "postgres",
      projectRef: host.replace(/^db\./, "").replace(/\.supabase\.co$/, "")
    };
  }

  if (host.endsWith(".pooler.supabase.com")) {
    return {
      type: parsedUrl.port === "6543" ? "pooler-transaction" : "pooler-session",
      expectedPort: "5432 session pooler or 6543 transaction pooler",
      expectedUsername: "postgres.<project-ref>",
      projectRef: username.startsWith("postgres.")
        ? username.replace(/^postgres\./, "")
        : "(not inferable from username)"
    };
  }

  return {
    type: "unknown/non-supabase-standard",
    expectedPort: "(unknown)",
    expectedUsername: "(unknown)",
    projectRef: "(unknown)"
  };
}

function shouldUseSsl(url) {
  return (
    url.includes("supabase.co") ||
    url.includes("pooler.supabase.com") ||
    pgSslMode === "require"
  );
}

function printDiagnostic(parsedUrl, rawCredentials) {
  const rawPassword = rawCredentials.password;
  const passwordSymbols = getUrlBreakingPasswordSymbols(rawPassword);
  const supabase = inferSupabaseConnection(parsedUrl, rawCredentials.username);
  const sslEnabled = shouldUseSsl(databaseUrl);

  console.log("DATABASE_URL diagnostic");
  console.log("-----------------------");
  console.log(`protocol: ${parsedUrl.protocol.replace(":", "")}`);
  console.log(`username: ${decodeURIComponent(rawCredentials.username || parsedUrl.username)}`);
  console.log(`host: ${parsedUrl.hostname}`);
  console.log(`port: ${parsedUrl.port || "(none)"}`);
  console.log(`database: ${parsedUrl.pathname.replace(/^\//, "") || "(none)"}`);
  console.log(`passwordLength: ${rawPassword ? safeDecodedLength(rawPassword) : 0}`);
  console.log(`passwordUrlBreakingSymbols: ${passwordSymbols.length ? passwordSymbols.join(", ") : "none detected"}`);
  console.log(`PGSSLMODE: ${pgSslMode || "(unset)"}`);
  console.log(`sslAppliedByTestClient: ${sslEnabled ? "yes" : "no"}`);
  console.log(`supabaseConnectionType: ${supabase.type}`);
  console.log(`supabaseProjectRef: ${supabase.projectRef}`);
  console.log(`expectedPort: ${supabase.expectedPort}`);
  console.log(`expectedUsername: ${supabase.expectedUsername}`);

  if (parsedUrl.hostname.endsWith(".pooler.supabase.com") && !sslEnabled) {
    console.log("warning: pooler host detected but SSL is not enabled by env/config.");
  }

  if (
    parsedUrl.hostname.endsWith(".pooler.supabase.com") &&
    !decodeURIComponent(rawCredentials.username || parsedUrl.username).startsWith("postgres.")
  ) {
    console.log("warning: Supabase pooler username usually must be postgres.<project-ref>, not plain postgres.");
  }
}

function safeDecodedLength(value) {
  try {
    return decodeURIComponent(value).length;
  } catch {
    return value.length;
  }
}

async function main() {
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set after loading .env.local.");
    process.exitCode = 1;
    return;
  }

  const rawCredentials = getRawCredentials(databaseUrl);
  let parsedUrl;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch (error) {
    console.error("FAIL: DATABASE_URL could not be parsed.");
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`rawUsernamePresent: ${rawCredentials.username ? "yes" : "no"}`);
    console.log(`rawPasswordLength: ${rawCredentials.password.length}`);
    console.log(
      `passwordUrlBreakingSymbols: ${
        getUrlBreakingPasswordSymbols(rawCredentials.password).join(", ") || "none detected"
      }`
    );
    process.exitCode = 1;
    return;
  }

  printDiagnostic(parsedUrl, rawCredentials);

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined
  });

  try {
    const result = await pool.query("SELECT now() AS now");
    console.log("-----------------------");
    console.log(`PASS: connected successfully at ${result.rows[0]?.now?.toISOString?.() ?? result.rows[0]?.now}`);
  } catch (error) {
    console.log("-----------------------");
    console.error("FAIL: database connection failed.");
    if (error instanceof Error) {
      console.error(`message: ${error.message}`);
      if ("code" in error) {
        console.error(`code: ${error.code}`);
      }
    } else {
      console.error(`message: ${String(error)}`);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
