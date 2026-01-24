(() => {
  const app = document.getElementById("app");
  const storageKeys = {
    user: "aisDemoUser",
    shortlist: "aisShortlist",
  };

  const state = {
    mode: "mock",
    profiles: [],
    roles: [],
    selectedProfileId: null,
    recommendations: [],
    upskillingPlan: [],
    biasCheck: null,
    loading: {
      recommendations: false,
      upskilling: false,
      bias: false,
    },
    decisionLog: {
      lastUpdated: null,
      model: "AIS-Opti-2026",
      version: "v1.0-mock",
    },
    notices: [],
    user: null,
    shortlist: [],
    recentDecisions: [
      {
        id: "d1",
        timestamp: "2026-01-22 09:14 AM",
        action: "Role recommendations generated",
        model: "AIS-Opti-2026",
      },
      {
        id: "d2",
        timestamp: "2026-01-22 11:32 AM",
        action: "Bias check executed",
        model: "AIS-Opti-2026",
      },
      {
        id: "d3",
        timestamp: "2026-01-23 08:05 AM",
        action: "Upskilling plan generated",
        model: "AIS-Opti-2026",
      },
    ],
  };

  const skillNormalization = {
    excel: "data analysis",
    "ms excel": "data analysis",
    "data viz": "data visualization",
    "data vizualization": "data visualization",
    "power bi": "data visualization",
    "project mgmt": "project management",
    "project management": "project management",
    "stakeholder mgmt": "stakeholder management",
    "people analytics": "people analytics",
    "talent analytics": "people analytics",
    "hr analytics": "people analytics",
    sql: "sql",
    python: "python",
    ml: "machine learning",
    "machine learning": "machine learning",
    dashboarding: "data visualization",
    communication: "communication",
  };

  const mockProfiles = [
    {
      id: "p1",
      name: "Avery Chen",
      title: "HR Generalist",
      department: "People Operations",
      location: "Dallas, TX",
      availabilityHours: 6,
      budgetPreference: "free",
      demographics: { gender: "female", ethnicity: "asian" },
      skills: [
        "Employee Relations",
        "Communication",
        "Onboarding",
        "Excel",
        "HR Analytics",
      ],
    },
    {
      id: "p2",
      name: "Mateo Alvarez",
      title: "Recruiting Coordinator",
      department: "Talent Acquisition",
      location: "Atlanta, GA",
      availabilityHours: 8,
      budgetPreference: "paid",
      demographics: { gender: "male", ethnicity: "latinx" },
      skills: [
        "Interview Scheduling",
        "Stakeholder Mgmt",
        "Project Mgmt",
        "Data Viz",
        "Communication",
      ],
    },
    {
      id: "p3",
      name: "Priya Nair",
      title: "HR Analyst",
      department: "People Analytics",
      location: "Chicago, IL",
      availabilityHours: 5,
      budgetPreference: "free",
      demographics: { gender: "female", ethnicity: "south asian" },
      skills: ["SQL", "Excel", "Dashboarding", "People Analytics"],
    },
    {
      id: "p4",
      name: "Jordan Blake",
      title: "Learning Specialist",
      department: "L&D",
      location: "Seattle, WA",
      availabilityHours: 7,
      budgetPreference: "paid",
      demographics: { gender: "non-binary", ethnicity: "white" },
      skills: [
        "Curriculum Design",
        "Facilitation",
        "Project Management",
        "Communication",
      ],
    },
    {
      id: "p5",
      name: "Riley Morgan",
      title: "Compensation Analyst",
      department: "Total Rewards",
      location: "New York, NY",
      availabilityHours: 4,
      budgetPreference: "free",
      demographics: { gender: "male", ethnicity: "black" },
      skills: ["Excel", "Compensation", "Benchmarking", "Data Analysis"],
    },
  ];

  const mockRoles = [
    {
      id: "r1",
      title: "People Analytics Specialist",
      requiredSkills: [
        "People Analytics",
        "Data Analysis",
        "SQL",
        "Data Visualization",
      ],
    },
    {
      id: "r2",
      title: "Talent Optimization Advisor",
      requiredSkills: [
        "Stakeholder Management",
        "Project Management",
        "Communication",
        "People Analytics",
      ],
    },
    {
      id: "r3",
      title: "HR Technology Analyst",
      requiredSkills: ["Data Analysis", "SQL", "Process Mapping", "Communication"],
    },
    {
      id: "r4",
      title: "Learning Experience Designer",
      requiredSkills: [
        "Curriculum Design",
        "Facilitation",
        "Project Management",
        "Data Visualization",
      ],
    },
    {
      id: "r5",
      title: "Total Rewards Insights Analyst",
      requiredSkills: [
        "Compensation",
        "Benchmarking",
        "Data Analysis",
        "Communication",
      ],
    },
    {
      id: "r6",
      title: "Workforce Planning Analyst",
      requiredSkills: [
        "Data Analysis",
        "Scenario Planning",
        "Stakeholder Management",
        "SQL",
      ],
    },
  ];

  const roleLabels = {
    employee: "Employee",
    recruiter: "Recruiter",
    admin: "Admin",
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadUser = () => {
    const raw = localStorage.getItem(storageKeys.user);
    return raw ? JSON.parse(raw) : null;
  };

  const saveUser = (user) => {
    localStorage.setItem(storageKeys.user, JSON.stringify(user));
  };

  const clearUser = () => {
    localStorage.removeItem(storageKeys.user);
  };

  const loadShortlist = () => {
    const raw = localStorage.getItem(storageKeys.shortlist);
    return raw ? JSON.parse(raw) : [];
  };

  const saveShortlist = (shortlist) => {
    localStorage.setItem(storageKeys.shortlist, JSON.stringify(shortlist));
  };

  const normalizeSkill = (skill) => {
    const key = skill.trim().toLowerCase();
    return skillNormalization[key] || key;
  };

  const normalizeSkills = (skills) =>
    Array.from(new Set(skills.map(normalizeSkill)));

  const getProfileById = (id) =>
    state.profiles.find((profile) => profile.id === id);

  const getProfileByName = (name) => {
    const normalized = name.trim().toLowerCase();
    return state.profiles.find(
      (profile) => profile.name.toLowerCase() === normalized
    );
  };

  const scoreRole = (profile, role) => {
    const profileSkills = normalizeSkills(profile.skills);
    const roleSkills = normalizeSkills(role.requiredSkills);
    const matched = roleSkills.filter((skill) => profileSkills.includes(skill));
    const gaps = roleSkills.filter((skill) => !profileSkills.includes(skill));
    const score = Math.round((matched.length / roleSkills.length) * 100);

    return {
      role,
      score,
      matchedSkills: matched,
      gaps,
    };
  };

  const buildExplanation = (profile, recommendation) => {
    const { role, matchedSkills, gaps, score } = recommendation;
    const matchedText = matchedSkills.length
      ? matchedSkills.join(", ")
      : "adjacent experience";
    const gapText = gaps.length ? gaps.join(", ") : "no critical gaps";

    return `${profile.name} aligns well with ${role.title} because of strengths in ${matchedText}. The current match score is ${score}%, with remaining growth areas in ${gapText}. This recommendation prioritizes explainability, showing clear skill evidence and transparent gaps for review.`;
  };

  const getTopRecommendations = (profile) =>
    state.roles
      .map((role) => scoreRole(profile, role))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((rec) => ({
        ...rec,
        explanation: buildExplanation(profile, rec),
      }));

  const buildUpskillingPlan = (profile, recommendations) => {
    const gaps = recommendations
      .flatMap((rec) => rec.gaps)
      .filter(Boolean);
    const uniqueGaps = Array.from(new Set(gaps));

    return uniqueGaps.map((skill, index) => {
      const duration = profile.availabilityHours >= 7 ? 4 : 6;
      const hoursPerWeek = Math.min(profile.availabilityHours, 6);
      const costTier =
        profile.budgetPreference === "paid" ? "Paid" : "Free";

      return {
        step: index + 1,
        skill,
        durationWeeks: duration + index,
        hoursPerWeek,
        costTier,
      };
    });
  };

  const runBiasCheck = async (profile) => {
    const swappedProfile = {
      ...profile,
      demographics: {
        gender:
          profile.demographics.gender === "female"
            ? "male"
            : "female",
        ethnicity:
          profile.demographics.ethnicity === "white"
            ? "black"
            : "white",
      },
    };

    const baseline = getTopRecommendations(profile);
    const swapped = getTopRecommendations(swappedProfile);

    const baselineIds = baseline.map((rec) => rec.role.id).join(",");
    const swappedIds = swapped.map((rec) => rec.role.id).join(",");
    const scoreDelta = Math.abs(baseline[0].score - swapped[0].score);

    const flagged =
      baselineIds !== swappedIds || scoreDelta >= 15;

    return {
      status: flagged ? "Flagged" : "Pass",
      message: flagged
        ? "A demographic swap changed the top role ordering or score. Human review is recommended to ensure fairness."
        : "Recommendations are consistent when demographic attributes are swapped.",
    };
  };

  const setLoading = (key, value) => {
    state.loading[key] = value;
    render();
  };

  const addNotice = (type, message) => {
    state.notices.push({ type, message, id: Date.now() });
    render();
  };

  const clearNotices = () => {
    state.notices = [];
  };

  const updateDecisionLog = () => {
    state.decisionLog.lastUpdated = new Date().toLocaleString();
  };

  const ensureEmployeeProfile = () => {
    if (!state.user || state.user.role !== "employee") return;
    if (state.user.name) {
      const match = getProfileByName(state.user.name);
      if (match) {
        state.selectedProfileId = match.id;
        return;
      }
    }
    state.selectedProfileId = state.profiles[0]?.id || null;
  };

  const addToShortlist = (profileId) => {
    if (!profileId) return;
    if (!state.shortlist.includes(profileId)) {
      state.shortlist.push(profileId);
      saveShortlist(state.shortlist);
      addNotice("success", "Candidate added to shortlist.");
    }
  };

  const removeFromShortlist = (profileId) => {
    state.shortlist = state.shortlist.filter((id) => id !== profileId);
    saveShortlist(state.shortlist);
    render();
  };

  const renderLogin = () => {
    app.innerHTML = `
      <div class="login-shell d-flex align-items-center">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
              <div class="card shadow-sm">
                <div class="card-body p-4">
                  <h1 class="h4 mb-2">AIS Talent Optimization – Demo Access</h1>
                  <p class="small-muted">Select a role to enter the demo environment.</p>
                  <div class="mb-3">
                    <label class="form-label">Role</label>
                    <select class="form-select" id="roleSelect">
                      <option value="employee">Employee</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Display name (optional)</label>
                    <input type="text" class="form-control" id="displayNameInput" placeholder="e.g., Alex Morgan" />
                  </div>
                  <button class="btn btn-primary w-100" id="enterDemoButton">Enter Demo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("enterDemoButton")?.addEventListener("click", () => {
      const role = document.getElementById("roleSelect").value;
      const nameInput = document.getElementById("displayNameInput").value.trim();
      state.user = {
        role,
        name: nameInput || "Demo User",
      };
      saveUser(state.user);
      ensureEmployeeProfile();
      render();
    });
  };

  const renderNavbar = () => `
    <nav class="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
      <div class="container">
        <span class="navbar-brand fw-semibold">AIS 2026 Talent Optimization</span>
        <div class="d-flex align-items-center gap-3">
          <span class="badge role-badge">${roleLabels[state.user.role]}</span>
          <span class="small-muted">${state.user.name}</span>
          <button class="btn btn-outline-secondary btn-sm" data-action="logout">Switch Role / Log out</button>
        </div>
      </div>
    </nav>
  `;

  const renderNotices = () => {
    if (!state.notices.length) return "";
    return state.notices
      .map(
        (notice) => `
          <div class="alert alert-${notice.type} d-flex justify-content-between align-items-center" role="alert">
            <div>${notice.message}</div>
            <button class="btn btn-sm btn-outline-${notice.type === "danger" ? "light" : notice.type} ms-2" data-action="dismiss-notice" data-id="${notice.id}">Dismiss</button>
          </div>
        `
      )
      .join("");
  };

  const renderRoleCard = (rec) => `
    <div class="card role-card shadow-sm mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="card-title mb-1">${rec.role.title}</h5>
            <span class="badge badge-hr">Human Review Recommended</span>
          </div>
          <div class="text-end">
            <span class="small-muted">Match score</span>
            <div class="fs-5 fw-semibold">${rec.score}%</div>
          </div>
        </div>
        <div class="progress my-3" role="progressbar" aria-label="Match score">
          <div class="progress-bar" style="width: ${rec.score}%"></div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-2">
            <div class="fw-semibold">Matched skills</div>
            <div class="small-muted">
              ${rec.matchedSkills.length ? rec.matchedSkills.join(", ") : "None yet"}
            </div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="fw-semibold">Skill gaps</div>
            <div class="small-muted">
              ${rec.gaps.length ? rec.gaps.join(", ") : "No critical gaps"}
            </div>
          </div>
        </div>
        <div class="mt-3">
          <div class="fw-semibold">Why this role was recommended</div>
          <p class="small-muted mb-0">${rec.explanation}</p>
        </div>
      </div>
    </div>
  `;

  const renderUpskillingRows = () => {
    if (!state.upskillingPlan.length) {
      return `
        <tr>
          <td colspan="5" class="text-center small-muted py-4">
            Run the upskilling plan to see a sequenced path.
          </td>
        </tr>
      `;
    }

    return state.upskillingPlan
      .map(
        (step) => `
          <tr>
            <td>${step.step}</td>
            <td>${step.skill}</td>
            <td>${step.durationWeeks}</td>
            <td>${step.hoursPerWeek}</td>
            <td><span class="badge ${step.costTier === "Free" ? "text-bg-success" : "text-bg-primary"}">${step.costTier}</span></td>
          </tr>
        `
      )
      .join("");
  };

  const renderBiasBadge = () => {
    if (!state.biasCheck) {
      return `<span class="badge text-bg-secondary">Not Run</span>`;
    }
    const isFlagged = state.biasCheck.status === "Flagged";
    return `<span class="badge ${isFlagged ? "text-bg-warning" : "text-bg-success"}">${state.biasCheck.status}</span>`;
  };

  const renderShortlist = () => {
    if (!state.shortlist.length) {
      return `<div class="small-muted">No candidates shortlisted yet.</div>`;
    }
    return `
      <ul class="list-group shortlist-panel">
        ${state.shortlist
          .map((id) => {
            const profile = getProfileById(id);
            if (!profile) return "";
            return `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${profile.name}</span>
                <button class="btn btn-sm btn-outline-danger" data-action="remove-shortlist" data-id="${profile.id}">Remove</button>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  };

  const renderRolesList = () => `
    <div class="mt-3">
      <div class="fw-semibold mb-2">Open Roles</div>
      <ul class="list-group">
        ${state.roles
          .map(
            (role) =>
              `<li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${role.title}</span>
                <span class="badge text-bg-light">${role.requiredSkills.length} skills</span>
              </li>`
          )
          .join("")}
      </ul>
    </div>
  `;

  const renderGovernanceCenter = () => `
    <div class="card shadow-sm mt-4">
      <div class="card-body">
        <h3 class="h5 section-title">Governance Center</h3>
        <div class="mb-3">
          <div class="fw-semibold">Recent decision logs</div>
          <ul class="list-group mt-2">
            ${state.recentDecisions
              .map(
                (log) => `
                  <li class="list-group-item">
                    <div class="fw-semibold">${log.action}</div>
                    <div class="small-muted">${log.timestamp} • ${log.model}</div>
                  </li>
                `
              )
              .join("")}
          </ul>
        </div>
        <div class="mb-3">
          <div class="fw-semibold">Bias check results</div>
          <div class="small-muted">
            ${state.biasCheck ? state.biasCheck.message : "No bias checks executed in this session."}
          </div>
        </div>
        <div>
          <div class="fw-semibold">Privacy settings</div>
          <div class="small-muted">PII redaction: ON</div>
          <div class="small-muted">Data retention: 30 days</div>
          <div class="small-muted">Human review required: YES</div>
        </div>
      </div>
    </div>
  `;

  const renderEmployeeDashboard = () =>
    renderDashboardShell({
      allowBias: true,
      showShortlist: false,
      profileSelectDisabled: true,
      showRolesList: false,
      fairnessMessage: null,
      showGovernanceCenter: false,
    });

  const renderRecruiterDashboard = () =>
    renderDashboardShell({
      allowBias: false,
      showShortlist: true,
      profileSelectDisabled: false,
      showRolesList: false,
      fairnessMessage:
        "Fairness Summary: Bias checks are administered by the governance team. Results are available after admin review.",
      showGovernanceCenter: false,
    });

  const renderAdminDashboard = () =>
    renderDashboardShell({
      allowBias: true,
      showShortlist: false,
      profileSelectDisabled: false,
      showRolesList: true,
      fairnessMessage: null,
      showGovernanceCenter: true,
    });

  const renderDashboardShell = ({
    allowBias,
    showShortlist,
    profileSelectDisabled,
    showRolesList,
    fairnessMessage,
    showGovernanceCenter,
  }) => {
    const profile = getProfileById(state.selectedProfileId);
    const recommendationsMarkup = state.recommendations.length
      ? state.recommendations.map(renderRoleCard).join("")
      : `
        <div class="border rounded p-4 bg-white shadow-sm">
          <div class="fw-semibold">No recommendations yet</div>
          <div class="small-muted">Select a profile and generate role recommendations to begin.</div>
        </div>
      `;

    const biasMarkup = allowBias
      ? `
        <div class="d-flex align-items-center gap-2 mb-2">
          <div class="fw-semibold">Bias check status</div>
          ${renderBiasBadge()}
        </div>
        <div class="small-muted mb-3">
          ${state.biasCheck ? state.biasCheck.message : "Run the bias check to validate fairness consistency."}
        </div>
      `
      : `
        <div class="fw-semibold mb-2">Fairness Summary</div>
        <div class="small-muted mb-3">${fairnessMessage}</div>
      `;

    return `
      <div class="app-container">
        ${renderNavbar()}
        <header class="ey-gradient text-white py-4">
          <div class="container">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
              <div>
                <h1 class="h3 mb-1">AIS 2026: AI Driven Talent Optimization</h1>
                <p class="mb-0">Explainable AI recommendations for talent matching, upskilling, and fairness review.</p>
              </div>
              <div class="mt-3 mt-lg-0">
                <div class="form-check form-switch text-white">
                  <input class="form-check-input" type="checkbox" role="switch" id="modeToggle" ${
                    state.mode === "api" ? "checked" : ""
                  } />
                  <label class="form-check-label" for="modeToggle">
                    ${state.mode === "api" ? "API Mode" : "Mock Mode"}
                  </label>
                </div>
                <div class="small text-white-50">API Mode falls back to Mock Mode on error.</div>
              </div>
            </div>
          </div>
        </header>

        <main class="container my-4">
          ${renderNotices()}
          <div class="row g-4">
            <aside class="col-lg-4">
              <div class="card sidebar-card shadow-sm">
                <div class="card-body">
                  <h2 class="h5 section-title">Profile Selection</h2>
                  <div class="small-muted mb-3">Select a synthetic employee profile to begin.</div>
                  <label for="profileSelect" class="form-label">Employee Profile</label>
                  <select class="form-select mb-3" id="profileSelect" aria-label="Select employee profile" ${
                    profileSelectDisabled ? "disabled" : ""
                  }>
                    ${state.profiles
                      .map(
                        (p) =>
                          `<option value="${p.id}" ${
                            p.id === state.selectedProfileId ? "selected" : ""
                          }>${p.name} — ${p.title}</option>`
                      )
                      .join("")}
                  </select>
                  ${
                    profile
                      ? `
                      <div class="mb-3">
                        <div class="fw-semibold">${profile.department}</div>
                        <div class="small-muted">${profile.location}</div>
                        <div class="small-muted">Availability: ${profile.availabilityHours} hrs/week</div>
                        <div class="small-muted">Budget: ${profile.budgetPreference}</div>
                      </div>
                    `
                      : ""
                  }
                  <div class="d-grid gap-2">
                    <button class="btn btn-primary" data-action="recommendations" ${state.loading.recommendations ? "disabled" : ""}>
                      ${state.loading.recommendations ? `<span class="spinner-border spinner-border-sm me-2"></span>Generating...` : "Generate Role Recommendations"}
                    </button>
                    <button class="btn btn-outline-primary" data-action="upskilling" ${state.loading.upskilling ? "disabled" : ""}>
                      ${state.loading.upskilling ? `<span class="spinner-border spinner-border-sm me-2"></span>Building plan...` : "Generate Upskilling Plan"}
                    </button>
                    <button class="btn btn-outline-dark" data-action="bias" ${state.loading.bias ? "disabled" : ""} ${allowBias ? "" : "disabled"}>
                      ${state.loading.bias ? `<span class="spinner-border spinner-border-sm me-2"></span>Running check...` : "Run Bias Check"}
                    </button>
                  </div>
                  ${
                    showShortlist
                      ? `
                        <div class="mt-3">
                          <button class="btn btn-outline-success w-100" data-action="shortlist-add">Add to Shortlist</button>
                        </div>
                        <div class="mt-3">
                          <div class="fw-semibold mb-2">Candidate Shortlist</div>
                          ${renderShortlist()}
                        </div>
                      `
                      : ""
                  }
                  ${showRolesList ? renderRolesList() : ""}
                </div>
              </div>
            </aside>

            <section class="col-lg-8">
              <div class="mb-4">
                <h2 class="h4 section-title">Recommended Roles</h2>
                ${recommendationsMarkup}
              </div>

              <div class="mb-4">
                <h2 class="h4 section-title">Upskilling Plan</h2>
                <div class="table-responsive shadow-sm bg-white rounded">
                  <table class="table mb-0">
                    <thead class="table-light">
                      <tr>
                        <th scope="col">Step</th>
                        <th scope="col">Skill to learn</th>
                        <th scope="col">Duration (weeks)</th>
                        <th scope="col">Hours / week</th>
                        <th scope="col">Cost tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderUpskillingRows()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 class="h4 section-title">Governance &amp; Guardrails</h2>
                <div class="card shadow-sm">
                  <div class="card-body">
                    ${biasMarkup}
                    <div class="mb-3">
                      <div class="fw-semibold">Privacy notice</div>
                      <div class="small-muted">This demo uses synthetic data. No PII is sent to the AI model.</div>
                    </div>
                    <div class="decision-log">
                      <div class="fw-semibold">Decision log</div>
                      <div class="small-muted">
                        Logged at: ${state.decisionLog.lastUpdated || "Pending action"} |
                        Model: ${state.decisionLog.model} |
                        Version: ${state.decisionLog.version}
                      </div>
                      <div class="small-muted">Human confirmation required before execution.</div>
                    </div>
                  </div>
                </div>
              </div>
              ${showGovernanceCenter ? renderGovernanceCenter() : ""}
            </section>
          </div>
        </main>
      </div>
    `;
  };

  const render = () => {
    if (!state.user) {
      renderLogin();
      return;
    }

    if (state.user.role === "employee") {
      ensureEmployeeProfile();
      app.innerHTML = renderEmployeeDashboard();
    } else if (state.user.role === "recruiter") {
      app.innerHTML = renderRecruiterDashboard();
    } else {
      app.innerHTML = renderAdminDashboard();
    }

    const profileSelect = document.getElementById("profileSelect");
    profileSelect?.addEventListener("change", (event) => {
      state.selectedProfileId = event.target.value;
      render();
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = event.currentTarget.dataset.action;
        clearNotices();
        if (action === "logout") {
          clearUser();
          state.user = null;
          render();
          return;
        }
        if (!state.selectedProfileId) return;
        if (action === "recommendations") {
          await handleRecommendations();
        }
        if (action === "upskilling") {
          await handleUpskilling();
        }
        if (action === "bias") {
          if (state.user.role !== "recruiter") {
            await handleBiasCheck();
          }
        }
        if (action === "shortlist-add") {
          addToShortlist(state.selectedProfileId);
        }
        if (action === "remove-shortlist") {
          const id = event.currentTarget.dataset.id;
          removeFromShortlist(id);
        }
        if (action === "dismiss-notice") {
          const id = Number(event.currentTarget.dataset.id);
          state.notices = state.notices.filter((notice) => notice.id !== id);
          render();
        }
      });
    });

    document
      .getElementById("modeToggle")
      ?.addEventListener("change", (event) => {
        state.mode = event.target.checked ? "api" : "mock";
        render();
      });
  };

  const handleRecommendations = async () => {
    setLoading("recommendations", true);
    await sleep(450);
    try {
      const profile = getProfileById(state.selectedProfileId);
      if (!profile) return;
      if (state.mode === "api") {
        const data = await fetchRecommendationsAPI(profile);
        state.recommendations = data;
      } else {
        state.recommendations = getTopRecommendations(profile);
      }
      updateDecisionLog();
    } catch (error) {
      addNotice("danger", "API call failed. Falling back to Mock Mode.");
      state.mode = "mock";
      const profile = getProfileById(state.selectedProfileId);
      state.recommendations = getTopRecommendations(profile);
      updateDecisionLog();
    } finally {
      setLoading("recommendations", false);
    }
  };

  const handleUpskilling = async () => {
    setLoading("upskilling", true);
    await sleep(450);
    try {
      const profile = getProfileById(state.selectedProfileId);
      if (!profile) return;
      if (!state.recommendations.length) {
        state.recommendations = getTopRecommendations(profile);
      }
      if (state.mode === "api") {
        state.upskillingPlan = await fetchUpskillingAPI(profile);
      } else {
        state.upskillingPlan = buildUpskillingPlan(
          profile,
          state.recommendations
        );
      }
      updateDecisionLog();
    } catch (error) {
      addNotice("danger", "API call failed. Falling back to Mock Mode.");
      state.mode = "mock";
      const profile = getProfileById(state.selectedProfileId);
      state.recommendations = getTopRecommendations(profile);
      state.upskillingPlan = buildUpskillingPlan(
        profile,
        state.recommendations
      );
      updateDecisionLog();
    } finally {
      setLoading("upskilling", false);
    }
  };

  const handleBiasCheck = async () => {
    setLoading("bias", true);
    await sleep(450);
    try {
      const profile = getProfileById(state.selectedProfileId);
      if (!profile) return;
      if (state.mode === "api") {
        state.biasCheck = await fetchBiasAPI(profile);
      } else {
        state.biasCheck = await runBiasCheck(profile);
      }
      updateDecisionLog();
    } catch (error) {
      addNotice("danger", "API call failed. Falling back to Mock Mode.");
      state.mode = "mock";
      const profile = getProfileById(state.selectedProfileId);
      state.biasCheck = await runBiasCheck(profile);
      updateDecisionLog();
    } finally {
      setLoading("bias", false);
    }
  };

  const fetchProfilesAPI = async () => {
    const response = await fetch("/api/profiles");
    if (!response.ok) throw new Error("Profiles request failed");
    return response.json();
  };

  const fetchRolesAPI = async () => {
    const response = await fetch("/api/roles");
    if (!response.ok) throw new Error("Roles request failed");
    return response.json();
  };

  const fetchRecommendationsAPI = async (profile) => {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    if (!response.ok) throw new Error("Recommendations request failed");
    return response.json();
  };

  const fetchUpskillingAPI = async (profile) => {
    const response = await fetch("/api/upskilling-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    if (!response.ok) throw new Error("Upskilling request failed");
    return response.json();
  };

  const fetchBiasAPI = async (profile) => {
    const response = await fetch("/api/bias-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    if (!response.ok) throw new Error("Bias check request failed");
    return response.json();
  };

  const init = async () => {
    state.profiles = mockProfiles;
    state.roles = mockRoles;
    state.user = loadUser();
    state.shortlist = loadShortlist();
    state.selectedProfileId = state.profiles[0]?.id || null;

    try {
      if (state.mode === "api") {
        const [profiles, roles] = await Promise.all([
          fetchProfilesAPI(),
          fetchRolesAPI(),
        ]);
        state.profiles = profiles;
        state.roles = roles;
      }
    } catch (error) {
      addNotice("warning", "API Mode unavailable. Using Mock Mode.");
      state.mode = "mock";
      state.profiles = mockProfiles;
      state.roles = mockRoles;
    }

    if (state.user?.role === "employee") {
      ensureEmployeeProfile();
    }

    render();
  };

  init();
})();