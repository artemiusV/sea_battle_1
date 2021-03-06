class ComputerScene extends Scene {
  untouchables = [];
  playerTurn = true;
  status = null;
  removeEventListeners = [];

  init() {
    this.status = document.querySelector('.battlefield-status');
  }

  start(untouchables) {
    const { opponent } = this.app;

    document
      .querySelectorAll('.app-actions')
      .forEach((element) => element.classList.add('hidden'));

    document
      .querySelector('[data-scene="computer"]')
      .classList.remove('hidden');

    opponent.clear();
    opponent.randomize(ShipView);

    // передать количество ячеек, по которым противник не будет стрелять
    this.untouchables = untouchables;

    this.removeEventListeners = [];

    // control buttons give up and start over
    const surrenderBtn = document.querySelector("[data-action='surrender']");

    const againBtn = document.querySelector("[data-action='again']");

    surrenderBtn.classList.remove('hidden');
    againBtn.classList.add('hidden');

    this.removeEventListeners.push(
      addEventListener(surrenderBtn, 'click', () => {
        this.app.start('preparation');
      })
    );

    this.removeEventListeners.push(
      addEventListener(againBtn, 'click', () => {
        this.app.start('preparation');
      })
    );
  }

  stop() {
    for (const removeEventListener of this.removeEventListeners) {
      removeEventListener();
    }

    this.removeEventListeners = [];
  }

  update() {
    const { mouse, opponent, player } = this.app;

    // determine the end of the game
    const isEnd = opponent.lost || player.lost;

    const cells = opponent.cells.flat();
    cells.forEach((cell) => cell.classList.remove('battlefield-item__active'));

    if (isEnd) {
      opponent.lost
        ? (this.status.textContent = 'Вы выиграли!')
        : (this.status.textContent = 'Вы проиграли((');

      document
        .querySelector("[data-action='surrender']")
        .classList.add('hidden');
      document
        .querySelector("[data-action='again']")
        .classList.remove('hidden');
      return;
    }


    // когда курсор над полем
    if (isUnderPoint(mouse, opponent.table)) {
      const cell = cells.find((cell) => isUnderPoint(mouse, cell));

      if (cell) {
        // on hover, the cell is painted over
        cell.classList.add('battlefield-item__active');

        // shot when clicking on a cell
        if (this.playerTurn && mouse.curLeftBtn && !mouse.prevLeftBtn) {
          const x = parseInt(cell.dataset.x);
          const y = parseInt(cell.dataset.y);

          const shot = new ShotView(x, y);
          const result = opponent.addShot(shot);

          // управление порядком перемещения
          if (result) {
            this.playerTurn = shot.variant === 'miss' ? false : true;
          }
        }
      }
    }

    // ход компа
    if (!this.playerTurn) {
      const x = getRandomBetween(0, 9);
      const y = getRandomBetween(0, 9);

      // check of a shot in a non-touching cell
      let inUntouchables = false;
      const { matrix } = player;
      for (const item of this.untouchables) {
        if ((item[0].x === x && item[0].y === y) || matrix[y][x].shouted) {
          inUntouchables = true;
        }
      }

      if (!inUntouchables) {
        const shot = new ShotView(x, y);
        const result = player.addShot(shot);

        if (result) {
          this.playerTurn = shot.variant === 'miss' ? true : false;
        }
      }
    }

    // выбор статцуса хода
    this.playerTurn
      ? (this.status.textContent = 'Ваш ход')
      : (this.status.textContent = 'Ход компьютера');
  }
}
