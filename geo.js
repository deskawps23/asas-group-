(() => {
  const nodes = document.querySelectorAll(".geo-node");
  const nodeGroup = document.querySelector(".geo-nodes");
  const reveal = document.getElementById("geoReveal");
  const revealTitle = document.getElementById("geoRevealTitle");
  const revealText = document.getElementById("geoRevealText");
  const revealRoute = document.getElementById("geoRevealRoute");

  if (!nodes.length || !nodeGroup || !reveal) return;

  function activateNode(node) {
    nodes.forEach((item) => {
      const active = item === node;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });

    nodeGroup.classList.add("has-active");

    revealTitle.textContent = node.dataset.title || "";
    revealText.textContent = node.dataset.context || "";
    revealRoute.href = node.dataset.route || "#";
    revealRoute.textContent = node.dataset.action || "Explore";

    reveal.classList.add("is-visible");
    reveal.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  nodes.forEach((node) => {
    node.addEventListener("click", () => activateNode(node));
  });
})();
