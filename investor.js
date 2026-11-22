(() => {
  const nodes = document.querySelectorAll(".investor-node");
  const nodeGroup = document.querySelector(".investor-nodes");
  const reveal = document.getElementById("investorReveal");
  const revealTitle = document.getElementById("investorRevealTitle");
  const revealText = document.getElementById("investorRevealText");
  const revealRoute = document.getElementById("investorRevealRoute");

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
