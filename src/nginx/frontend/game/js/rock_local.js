function setupRockLocal() {
  const gameContainer = document.querySelector(".container-rock1"),
        player1Result = document.querySelector(".player1_result img"),
        player2Result = document.querySelector(".player2_result img"),
        result1 = document.querySelector(".result1"),
        player1Btn = document.getElementById("player1Btn"),
        player2Btn = document.getElementById("player2Btn");
  
  let player1Choice = null;
  let player2Choice = null;
  let player1Score = 0;
  let player2Score = 0;

  const choices = ["images/rock.png", "images/paper.png", "images/scissors.png"];

  player1Btn.addEventListener("click", () => {
      player1Choice = Math.floor(Math.random() * 3);
      player1Result.src = choices[player1Choice];
      result1.textContent = "Player 1 has made a choice";

      if (player2Choice !== null) {
          determineWinner();
      }
  });

  player2Btn.addEventListener("click", () => {
      player2Choice = Math.floor(Math.random() * 3);
      player2Result.src = choices[player2Choice];
      result1.textContent = "Player 2 has made a choice";

      if (player1Choice !== null) {
          determineWinner();
      }
  });

  function determineWinner() {
      gameContainer.classList.add("start");

      setTimeout(() => {
          gameContainer.classList.remove("start");

          const outcomes = {
              0: { 0: "Draw", 1: "Player 2", 2: "Player 1" },
              1: { 0: "Player 1", 1: "Draw", 2: "Player 2" },
              2: { 0: "Player 2", 1: "Player 1", 2: "Draw" }
          };

          const winner = outcomes[player1Choice][player2Choice];
          if (winner === "Player 1") {
              player1Score++;
          } else if (winner === "Player 2") {
              player2Score++;
          }

          result1.textContent = winner === "Draw" ? "Match Draw" : `${winner} Won!!`;

          player1Choice = player2Choice = null;
      }, 1000);
  }
}
