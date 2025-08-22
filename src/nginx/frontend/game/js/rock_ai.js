function setupRockAI() {
  const gameContainer = document.querySelector(".container-rock");
  const userResult = document.querySelector(".user_result img");
  const cpuResult = document.querySelector(".cpu_result img");
  const result = document.querySelector(".result");
  const optionImages = document.querySelectorAll(".option_image");
  const profile = document.querySelector('.user_card img');
  const name = document.querySelector('.user_card p');
  loadUserdata_game(profile, name);

  if (!gameContainer || !userResult || !cpuResult || !result || optionImages.length === 0) {
      return;
  }

  optionImages.forEach((image, index) => {
    image.addEventListener("click", (e) => {
      image.classList.add("active");
  
      let optionImageDiv = e.target.closest(".option_image");
      let imgElement = optionImageDiv ? optionImageDiv.querySelector("img") : null;
  
      if (!imgElement) {
        return;
      }
  
      let imageSrc = imgElement.src;
      userResult.src = cpuResult.src = "images/rock.png";
      result.textContent = "Wait...";
  
      optionImages.forEach((image2, index2) => {
        if (index !== index2) {
          image2.classList.remove("active");
        }
      });
  
      gameContainer.classList.add("start");
  
      setTimeout(() => {
        gameContainer.classList.remove("start");
  
        userResult.src = imageSrc;
  
        let randomNumber = Math.floor(Math.random() * 3);
        let cpuImages = ["images/rock.png", "images/paper.png", "images/scissors.png"];
        cpuResult.src = cpuImages[randomNumber];
  
        let cpuValue = ["R", "P", "S"][randomNumber];
        let userValue = ["R", "P", "S"][index];
  
        let outcomes = {
          RR: "Draw",
          RP: "AI",
          RS: name.textContent,
          PP: "Draw",
          PR: name.textContent,
          PS: "AI",
          SS: "Draw",
          SR: "AI",
          SP: name.textContent,
        };
  
        let outComeValue = outcomes[userValue + cpuValue];
  
        result.textContent = userValue === cpuValue ? "Match Draw" : `${outComeValue} Won!!`;
      }, 2500);
    });
  });
  
}
