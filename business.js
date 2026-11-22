(() => {
  const nodes = document.querySelectorAll(".business-node");
  const nodeGroup = document.querySelector(".business-nodes");
  const reveal = document.getElementById("businessReveal");
  const revealTitle = document.getElementById("businessRevealTitle");
  const revealText = document.getElementById("businessRevealText");
  const revealRoute = document.getElementById("businessRevealRoute");

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
