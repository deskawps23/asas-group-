(() => {
  const nodes = document.querySelectorAll(".finance-node");
  const nodeGroup = document.querySelector(".finance-nodes");
  const reveal = document.getElementById("financeReveal");
  const revealTitle = document.getElementById("financeRevealTitle");
  const revealText = document.getElementById("financeRevealText");
  const revealRoute = document.getElementById("financeRevealRoute");

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
