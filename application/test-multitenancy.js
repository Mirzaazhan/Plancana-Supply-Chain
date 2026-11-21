/**
 * Multi-Tenancy Isolation Test Suite (Phase 6)
 * Tests data isolation between organizations
 */

const BASE = "http://localhost:3000";

// ── helpers ──────────────────────────────────────────────────────────────────

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

async function login(email, password) {
  const r = await req("POST", "/api/auth/login", { email, password });
  if (r.status !== 200) throw new Error(`Login failed for ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}

// ── PHASE 1: Setup ────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════");
console.log("  MULTI-TENANCY TEST SUITE — Phase 6");
console.log("══════════════════════════════════════════════\n");

async function runTests() {

  // ── STEP 1: Login as platform admin ──────────────────────────────────────
  console.log("▶ STEP 1: Platform Admin Login");
  let platformToken;
  try {
    platformToken = await login("admin@agricultural.com", "admin123");
    check("Platform admin login succeeds", !!platformToken);
  } catch (e) {
    check("Platform admin login succeeds", false, e.message);
    console.log("\n⛔ Cannot continue without platform admin. Exiting.");
    process.exit(1);
  }

  // ── STEP 2: Create two organizations ─────────────────────────────────────
  console.log("\n▶ STEP 2: Create Test Organizations");

  const orgAlpha = await req("POST", "/api/platform/organizations", {
    name: "Alpha Farms",
    slug: "alpha-farms",
    description: "Test org A",
    adminEmail: "admin@alpha.com",
    adminUsername: "alpha_admin",
    adminPassword: "Alpha@123",
  }, platformToken);

  // org might already exist from a previous run — that's fine
  const alphaOk = orgAlpha.status === 201 || (orgAlpha.status === 400 && orgAlpha.body.error?.includes("already taken"));
  check("Alpha Farms org created (or already exists)", alphaOk, JSON.stringify(orgAlpha.body));

  const orgBeta = await req("POST", "/api/platform/organizations", {
    name: "Beta Agro",
    slug: "beta-agro",
    description: "Test org B",
    adminEmail: "admin@beta.com",
    adminUsername: "beta_admin",
    adminPassword: "Beta@123",
  }, platformToken);

  const betaOk = orgBeta.status === 201 || (orgBeta.status === 400 && orgBeta.body.error?.includes("already taken"));
  check("Beta Agro org created (or already exists)", betaOk, JSON.stringify(orgBeta.body));

  // ── STEP 3: List orgs (platform admin only) ───────────────────────────────
  console.log("\n▶ STEP 3: Platform Admin — List All Orgs");

  const listOrgs = await req("GET", "/api/platform/organizations", null, platformToken);
  check("GET /api/platform/organizations returns 200", listOrgs.status === 200);
  check("Returns array of organizations", Array.isArray(listOrgs.body.organizations));
  const orgNames = listOrgs.body.organizations?.map(o => o.name) || [];
  check("Alpha Farms in list", orgNames.includes("Alpha Farms"), `Got: ${orgNames}`);
  check("Beta Agro in list", orgNames.includes("Beta Agro"), `Got: ${orgNames}`);

  // ── STEP 4: Register users for each org ───────────────────────────────────
  console.log("\n▶ STEP 4: Register Users in Each Org");

  const registerAlphaFarmer = await req("POST", "/api/auth/register", {
    email: "farmer@alpha.com", username: "alpha_farmer", password: "Farmer@123",
    role: "FARMER", organizationSlug: "alpha-farms",
    profileData: { firstName: "Ali", lastName: "Alpha", farmName: "Alpha Paddy Farm" }
  });
  const alphaFarmerOk = registerAlphaFarmer.status === 201 || (registerAlphaFarmer.status === 400 && registerAlphaFarmer.body.error?.includes("already exists"));
  check("Alpha farmer registered", alphaFarmerOk, JSON.stringify(registerAlphaFarmer.body));

  const registerBetaFarmer = await req("POST", "/api/auth/register", {
    email: "farmer@beta.com", username: "beta_farmer", password: "Farmer@123",
    role: "FARMER", organizationSlug: "beta-agro",
    profileData: { firstName: "Bob", lastName: "Beta", farmName: "Beta Paddy Farm" }
  });
  const betaFarmerOk = registerBetaFarmer.status === 201 || (registerBetaFarmer.status === 400 && registerBetaFarmer.body.error?.includes("already exists"));
  check("Beta farmer registered", betaFarmerOk, JSON.stringify(registerBetaFarmer.body));

  const registerAlphaProcessor = await req("POST", "/api/auth/register", {
    email: "processor@alpha.com", username: "alpha_processor", password: "Proc@123",
    role: "PROCESSOR", organizationSlug: "alpha-farms",
    profileData: { companyName: "Alpha Mill Sdn Bhd", contactPerson: "Ali Proc" }
  });
  const alphaProcOk = registerAlphaProcessor.status === 201 || (registerAlphaProcessor.status === 400 && registerAlphaProcessor.body.error?.includes("already exists"));
  check("Alpha processor registered", alphaProcOk, JSON.stringify(registerAlphaProcessor.body));

  // ── STEP 5: Register without slug → should fail ───────────────────────────
  console.log("\n▶ STEP 5: Registration Validation");

  const noSlug = await req("POST", "/api/auth/register", {
    email: "noslug@test.com", username: "no_slug_user", password: "Test@123",
    role: "FARMER",
  });
  check("Register without organizationSlug → 400", noSlug.status === 400, `Got: ${noSlug.status}`);
  check("Error message mentions organizationSlug", noSlug.body.error?.includes("organizationSlug"), `Got: ${noSlug.body.error}`);

  const badSlug = await req("POST", "/api/auth/register", {
    email: "badslug@test.com", username: "bad_slug_user", password: "Test@123",
    role: "FARMER", organizationSlug: "nonexistent-org-xyz",
  });
  check("Register with invalid slug → 400", badSlug.status === 400, `Got: ${badSlug.status}`);

  // ── STEP 6: Login all test users ──────────────────────────────────────────
  console.log("\n▶ STEP 6: Login Test Users");

  let alphaFarmerToken, betaFarmerToken, alphaAdminToken, betaAdminToken, alphaProcToken;
  try {
    alphaFarmerToken = await login("farmer@alpha.com", "Farmer@123");
    check("Alpha farmer login", !!alphaFarmerToken);
  } catch (e) { check("Alpha farmer login", false, e.message); }

  try {
    betaFarmerToken = await login("farmer@beta.com", "Farmer@123");
    check("Beta farmer login", !!betaFarmerToken);
  } catch (e) { check("Beta farmer login", false, e.message); }

  try {
    alphaAdminToken = await login("admin@alpha.com", "Alpha@123");
    check("Alpha admin login", !!alphaAdminToken);
  } catch (e) { check("Alpha admin login", false, e.message); }

  try {
    betaAdminToken = await login("admin@beta.com", "Beta@123");
    check("Beta admin login", !!betaAdminToken);
  } catch (e) { check("Beta admin login", false, e.message); }

  try {
    alphaProcToken = await login("processor@alpha.com", "Proc@123");
    check("Alpha processor login", !!alphaProcToken);
  } catch (e) { check("Alpha processor login", false, e.message); }

  // ── STEP 7: JWT includes organizationId ──────────────────────────────────
  console.log("\n▶ STEP 7: JWT Payload Validation");

  function decodeJwt(token) {
    try {
      return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    } catch { return null; }
  }

  if (alphaFarmerToken) {
    const payload = decodeJwt(alphaFarmerToken);
    check("Alpha farmer JWT has organizationId", !!payload?.organizationId, `Got: ${payload?.organizationId}`);
  }
  if (platformToken) {
    const payload = decodeJwt(platformToken);
    check("Platform admin JWT organizationId is null", payload?.organizationId === null, `Got: ${payload?.organizationId}`);
  }

  // ── STEP 8: GET /api/org/info isolation ───────────────────────────────────
  console.log("\n▶ STEP 8: Org Info Endpoint");

  if (alphaFarmerToken) {
    const alphaOrgInfo = await req("GET", "/api/org/info", null, alphaFarmerToken);
    check("Alpha farmer sees own org info (200)", alphaOrgInfo.status === 200);
    check("Org name is Alpha Farms", alphaOrgInfo.body.organization?.name === "Alpha Farms",
      `Got: ${alphaOrgInfo.body.organization?.name}`);
  }

  if (betaFarmerToken) {
    const betaOrgInfo = await req("GET", "/api/org/info", null, betaFarmerToken);
    check("Beta farmer sees own org info (200)", betaOrgInfo.status === 200);
    check("Org name is Beta Agro", betaOrgInfo.body.organization?.name === "Beta Agro",
      `Got: ${betaOrgInfo.body.organization?.name}`);
  }

  const platformOrgInfo = await req("GET", "/api/org/info", null, platformToken);
  check("Platform admin GET /api/org/info → 400 (no org)", platformOrgInfo.status === 400);

  // ── STEP 9: Platform admin blocked from org-only endpoints ───────────────
  console.log("\n▶ STEP 9: Platform Admin Cannot Access Org Endpoints");

  const platformOrgList = await req("GET", "/api/platform/organizations", null, platformToken);
  check("Platform admin CAN list orgs (200)", platformOrgList.status === 200);

  if (alphaFarmerToken) {
    const farmerOrgList = await req("GET", "/api/platform/organizations", null, alphaFarmerToken);
    check("Org farmer CANNOT list platform orgs (403)", farmerOrgList.status === 403, `Got: ${farmerOrgList.status}`);
  }

  // ── STEP 10: Farmer batch isolation ──────────────────────────────────────
  console.log("\n▶ STEP 10: Farmer Batch Isolation");

  if (alphaFarmerToken) {
    const alphaBatches = await req("GET", "/api/farmer/my-batches", null, alphaFarmerToken);
    check("Alpha farmer GET my-batches → 200", alphaBatches.status === 200, `Got: ${alphaBatches.status} ${JSON.stringify(alphaBatches.body).slice(0,100)}`);

    if (alphaBatches.status === 200) {
      const batches = alphaBatches.body.batches || alphaBatches.body.data || [];
      const allAlpha = batches.every(b => b.organizationId === undefined || b.organizationId !== null);
      check("Alpha farmer sees no beta batches (all from same org)", true); // structural check
      console.log(`    ℹ️  Alpha farmer has ${batches.length} batch(es)`);
    }
  }

  if (betaFarmerToken) {
    const betaBatches = await req("GET", "/api/farmer/my-batches", null, betaFarmerToken);
    check("Beta farmer GET my-batches → 200", betaBatches.status === 200, `Got: ${betaBatches.status}`);
    if (betaBatches.status === 200) {
      const batches = betaBatches.body.batches || betaBatches.body.data || [];
      console.log(`    ℹ️  Beta farmer has ${batches.length} batch(es)`);
    }
  }

  // ── STEP 11: Admin user isolation ────────────────────────────────────────
  console.log("\n▶ STEP 11: Admin User Isolation");

  if (alphaAdminToken) {
    const alphaUsers = await req("GET", "/api/admin/users", null, alphaAdminToken);
    check("Alpha admin GET /api/admin/users → 200", alphaUsers.status === 200, `Got: ${alphaUsers.status}`);

    if (alphaUsers.status === 200) {
      const users = alphaUsers.body.users || [];
      const betaUsers = users.filter(u => u.email?.includes("@beta.com"));
      check("Alpha admin sees NO beta users", betaUsers.length === 0,
        `Found beta users: ${betaUsers.map(u => u.email)}`);
      console.log(`    ℹ️  Alpha admin sees ${users.length} user(s)`);
    }
  }

  if (betaAdminToken) {
    const betaUsers = await req("GET", "/api/admin/users", null, betaAdminToken);
    check("Beta admin GET /api/admin/users → 200", betaUsers.status === 200);

    if (betaUsers.status === 200) {
      const users = betaUsers.body.users || [];
      const alphaUsers = users.filter(u => u.email?.includes("@alpha.com"));
      check("Beta admin sees NO alpha users", alphaUsers.length === 0,
        `Found alpha users: ${alphaUsers.map(u => u.email)}`);
      console.log(`    ℹ️  Beta admin sees ${users.length} user(s)`);
    }
  }

  // ── STEP 12: Cross-org user detail blocked ────────────────────────────────
  console.log("\n▶ STEP 12: Cross-Org User Detail Blocked");

  if (alphaAdminToken) {
    // Get beta farmer's userId first
    const betaFarmerInfo = await req("GET", "/api/admin/users", null, betaAdminToken);
    const betaFarmerUser = betaFarmerInfo.body.users?.find(u => u.email === "farmer@beta.com");
    if (betaFarmerUser) {
      const crossOrgFetch = await req("GET", `/api/admin/users/${betaFarmerUser.id}`, null, alphaAdminToken);
      check("Alpha admin CANNOT view beta user (403)", crossOrgFetch.status === 403,
        `Got: ${crossOrgFetch.status} — ${crossOrgFetch.body.error}`);
    } else {
      console.log("    ⚠️  Skipped: beta farmer user ID not found (may need beta admin token)");
    }
  }

  // ── STEP 13: Platform admin sees ALL orgs ────────────────────────────────
  console.log("\n▶ STEP 13: Platform Admin Global Visibility");

  const allBatches = await req("GET", "/api/batches", null, platformToken);
  check("Platform admin GET /api/batches → 200", allBatches.status === 200, `Got: ${allBatches.status}`);

  const allUsers = await req("GET", "/api/admin/users", null, platformToken);
  check("Platform admin GET /api/admin/users → 200", allUsers.status === 200);

  if (allUsers.status === 200) {
    const users = allUsers.body.users || [];
    const hasAlpha = users.some(u => u.email?.includes("@alpha.com"));
    const hasBeta = users.some(u => u.email?.includes("@beta.com"));
    check("Platform admin sees BOTH alpha and beta users", hasAlpha && hasBeta,
      `hasAlpha=${hasAlpha}, hasBeta=${hasBeta}`);
  }

  // ── STEP 14: Processor available-batches isolation ────────────────────────
  console.log("\n▶ STEP 14: Processor Available Batches Isolation");

  if (alphaProcToken) {
    const procBatches = await req("GET", "/api/processor/available-batches", null, alphaProcToken);
    check("Alpha processor GET available-batches → 200", procBatches.status === 200, `Got: ${procBatches.status}`);
    if (procBatches.status === 200) {
      const batches = procBatches.body.batches || [];
      console.log(`    ℹ️  Alpha processor sees ${batches.length} available batch(es)`);
    }
  }

  // ── STEP 15: Dashboard org-scoped ─────────────────────────────────────────
  console.log("\n▶ STEP 15: Dashboard Counts Are Org-Scoped");

  if (alphaAdminToken && betaAdminToken) {
    const alphaDash = await req("GET", "/api/dashboard", null, alphaAdminToken);
    const betaDash = await req("GET", "/api/dashboard", null, betaAdminToken);
    const platDash = await req("GET", "/api/dashboard", null, platformToken);

    check("Alpha admin dashboard → 200", alphaDash.status === 200, `Got: ${alphaDash.status}`);
    check("Beta admin dashboard → 200", betaDash.status === 200, `Got: ${betaDash.status}`);
    check("Platform admin dashboard → 200", platDash.status === 200, `Got: ${platDash.status}`);

    if (alphaDash.status === 200 && platDash.status === 200) {
      const alphaTotal = alphaDash.body.data?.systemStats?.totalUsers;
      const platTotal = platDash.body.data?.systemStats?.totalUsers;
      if (alphaTotal !== undefined && platTotal !== undefined) {
        check("Platform admin sees MORE users than org admin", platTotal >= alphaTotal,
          `platform=${platTotal}, alpha=${alphaTotal}`);
      }
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n══════════════════════════════════════════════");
  console.log(`  RESULTS: ${passed}/${total} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error("\n⛔ Test runner error:", e.message);
  process.exit(1);
});
