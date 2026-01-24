(() => {
  const app = document.getElementById("app");

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
    "sql": "sql",
    "python": "python",
    "ml": "machine learning",
    "machine learning": "machine learning",
    "dashboarding": "data visualization",
    "communication": "communication",
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const normalizeSkill = (skill) => {
    const key = skill.trim().toLowerCase();
    return skillNormalization[key] || key;
  };

  const normalizeSkills = (skills) =>
    Array.from(new Set(skills.map(normalizeSkill)));

  const getProfileById = (id) =>
    state.profiles.find((profile) => profile.id === id);

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

  const render = () => {
    const profile = getProfileById(state.selectedProfileId);
    const recommendationsMarkup = state.recommendations.length
      ? state.recommendations.map(renderRoleCard).join("")
      : `
        <div class="border rounded p-4 bg-white shadow-sm">
          <div class="fw-semibold">No recommendations yet</div>
          <div class="small-muted">Select a profile and generate role recommendations to begin.</div>
        </div>
      `;

    app.innerHTML = `
      <div class="app-container">
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
                  <select class="form-select mb-3" id="profileSelect" aria-label="Select employee profile">
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
                    <button class="btn btn-outline-dark" data-action="bias" ${state.loading.bias ? "disabled" : ""}>
                      ${state.loading.bias ? `<span class="spinner-border spinner-border-sm me-2"></span>Running check...` : "Run Bias Check"}
                    </button>
                  </div>
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
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <div class="fw-semibold">Bias check status</div>
                      ${renderBiasBadge()}
                    </div>
                    <div class="small-muted mb-3">
                      ${state.biasCheck ? state.biasCheck.message : "Run the bias check to validate fairness consistency."}
                    </div>
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
            </section>
          </div>
        </main>
      </div>
    `;

    const profileSelect = document.getElementById("profileSelect");
    profileSelect?.addEventListener("change", (event) => {
      state.selectedProfileId = event.target.value;
      render();
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = event.currentTarget.dataset.action;
        clearNotices();
        if (!state.selectedProfileId) return;
        if (action === "recommendations") {
          await handleRecommendations();
        }
        if (action === "upskilling") {
          await handleUpskilling();
        }
        if (action === "bias") {
          await handleBiasCheck();
        }
      });
    });

    document
      .getElementById("modeToggle")
      ?.addEventListener("change", (event) => {
        state.mode = event.target.checked ? "api" : "mock";
        render();
      });

    document.querySelectorAll("[data-action='dismiss-notice']").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const id = Number(event.currentTarget.dataset.id);
        state.notices = state.notices.filter((notice) => notice.id !== id);
        render();
      });
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

    render();
  };

  init();
})();