document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cardsContainer');

  // Inject dummy "Summer" card to match screenshot
  container.innerHTML += createCommitCard({
    title: "Summer",
    iconName: "book",
    showRisk: true,
    hasTime: true,
    locationIsActive: true,
    hasDigital: true
  });

  // Inject a secondary dummy card for visual weight
  container.innerHTML += createCommitCard({
    title: "Deep Work",
    iconName: "target",
    showRisk: false,
    hasTime: true,
    locationIsActive: false,
    hasDigital: true
  });
});
