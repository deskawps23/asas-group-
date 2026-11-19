const menuButton = document.querySelector('.menu');
const navigation = document.querySelector('.nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', function () {
    navigation.classList.toggle('open');
  });

  document.querySelectorAll('.nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      navigation.classList.remove('open');
    });
  });
}
