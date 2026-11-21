(() => {
  "use strict";

  const oldMain = document.querySelector("main");
  if (!oldMain || document.getElementById("asasNexusWorkspace")) return;

  document.body.classList.add("nexus-active");

  const app = document.createElement("div");
  app.id = "asasNexusWorkspace";
  app.className = "nexus-app";

  const domains = [
    ["Business","Program, project, site"],
    ["People","Leadership & culture"],
    ["Geo","Spatial operating context"],
    ["Data","Metadata & interoperability"],
    ["Intelligence","Nexus Intelligence Core"],
    ["Trust","Governance & approval"],
    ["Impact","Outcome & evidence"]
  ];

  const cards = domains.map((item, index) => `
    <article class="nexus-card" data-topic="${item[0]}">
      <b>0${index + 1}</b>
      <strong>${item[0]}</strong>
      <small>${item[1]}</small>
    </article>
  `).join("");

  app.innerHTML = `
    <header class="nexus-topbar">
      <div class="nexus-brand">
        <div class="nexus-logo">A</div>
        <div>
          <strong>ASAS Nexus</strong><br>
          <small>Connected Intelligence Workspace</small>
        </div>
      </div>
      <button type="button" class="nexus-nav" data-view-go="activity">Activity</button>
    </header>

    <div class="nexus-content">
      <section class="nexus-view active" data-view="home">
        <div class="nexus-hero">
          <small>ONE ASAS · LIVING WORKSPACE</small>
          <h1>Work connected.<br><span>Impact visible.</span></h1>
          <p>
            Business, People, Geo, Data, Intelligence, Trust dan Impact
            dalam satu workspace terhubung.
          </p>
        </div>

        <div class="nexus-grid">${cards}</div>

        <article class="nexus-feed">
          <strong>Nexus Feed</strong>
          <p>
            Workspace aktif. Feed hanya menampilkan informasi
            yang memiliki sumber dan status yang sesuai.
          </p>
        </article>
      </section>

      <section class="nexus-view" data-view="explore">
        <div class="nexus-hero">
          <small>EXPLORE · NOT BROWSE</small>
          <h1>Explore <span>Nexus.</span></h1>
          <p>
            Pilih domain untuk memusatkan konteks dan hubungan data.
          </p>
        </div>
        <div class="nexus-grid">${cards}</div>
      </section>

      <section class="nexus-view" data-view="create">
        <article class="nexus-feed">
          <strong>Create</strong>
          <p>
            Creation surface mengikuti role, approval dan governance.
            Tidak ada data bisnis yang dibuat secara fiktif.
          </p>
        </article>
      </section>

      <section class="nexus-view" data-view="activity">
        <article class="nexus-feed">
          <strong>Activity & Trust</strong>
          <p>
            Approval, publication dan audit trail akan muncul
            sesuai hak akses pengguna.
          </p>
        </article>
      </section>

      <section class="nexus-view" data-view="profile">
        <article class="nexus-feed">
          <strong>My ASAS Profile</strong>
          <p>
            Draft → Pending → Approved → Published
          </p>
          <div class="nexus-profile-host" id="nexusProfileHost"></div>
        </article>
      </section>
    </div>

    <nav class="nexus-bottom">
      <button type="button" class="nexus-nav active" data-view-go="home">Home</button>
      <button type="button" class="nexus-nav" data-view-go="explore">Explore</button>
      <button type="button" class="nexus-nav" data-view-go="create">Create</button>
      <button type="button" class="nexus-nav" data-view-go="activity">Activity</button>
      <button type="button" class="nexus-nav" data-view-go="profile">Profile</button>
    </nav>
  `;

  oldMain.parentNode.insertBefore(app, oldMain);
  app.querySelector("#nexusProfileHost").appendChild(oldMain);

  const views = [...app.querySelectorAll(".nexus-view")];
  const navs = [...app.querySelectorAll("[data-view-go]")];

  function openView(name) {
    views.forEach((view) => {
      view.classList.toggle(
        "active",
        view.dataset.view === name
      );
    });

    navs.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.viewGo === name
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  app.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-view-go]");

    if (nav) {
      openView(nav.dataset.viewGo);
      return;
    }

    const topic = event.target.closest("[data-topic]");

    if (topic) {
      const name = topic.dataset.topic;
      window.alert(
        name +
        " akan menampilkan data terhubung setelah sumbernya tersedia."
      );
    }
  });

  window.addEventListener("hashchange", () => {
    const name = location.hash.replace("#", "");

    if (
      ["home", "explore", "create", "activity", "profile"]
        .includes(name)
    ) {
      openView(name);
    }
  });

  const initial = location.hash.replace("#", "");

  if (
    ["home", "explore", "create", "activity", "profile"]
      .includes(initial)
  ) {
    openView(initial);
  }
})();
