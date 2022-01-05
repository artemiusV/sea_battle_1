class BattleField {
  ships = [];
  shots = [];

  _matrix = null;
  _changed = true;

  //проверка убитых кораблей  
  get lost() {
    for (const ship of this.ships) {
      if (!ship.killed) {
        return false;
      }
    }

    return true;
  }

  // matrix контроля и изменений
  get matrix() {
    if (!this._changed) {
      this._matrix;
    }

    const matrix = [];

    for (let y = 0; y < 10; y++) {
      const row = [];

      for (let x = 0; x < 10; x++) {
        const item = {
          x,
          y,
          ship: null,
          free: true,
          shouted: false,
          wounded: false,
        };

        row.push(item);
      }

      matrix.push(row);
    }

    // проверка где находитмя корабль
    for (const ship of this.ships) {
      if (!ship.placed) {
        continue;
      }
      const { x, y } = ship;
      // выбор напрления
      const dx = ship.direction === 'row';
      const dy = ship.direction === 'column';
      // write coordinates
      for (let i = 0; i < ship.size; i++) {
        const item = matrix[y + dy * i][x + dx * i];
        item.ship = ship;
      }

      // optimized
      for (let y = ship.y - 1; y < ship.y + ship.size * dy + dx + 1; y++) {
        for (let x = ship.x - 1; x < ship.x + ship.size * dx + dy + 1; x++) {
          if (this.inField(x, y)) {
            const item = matrix[y][x];
            item.free = false;
          }
        }
      }
    }

    // проверяем место выстрела
    for (const { x, y } of this.shots) {
      const item = matrix[y][x];
      // mark the cell after shooting at it
      item.shouted = true;

      // есои в ячейке корабль раненыю. то маркеруем ранение
      if (item.ship) {
        item.wounded = true;
      }
    }

    this._matrix = matrix;
    this._changed = false;
    return this._matrix;
  }

  // проверяем размещение всех кораблей на игровом поле
  get complete() {
    if (this.ships.length !== 10) {
      return false;
    }

    for (const ship of this.ships) {
      if (!ship.placed) {
        return false;
      }
    }

    return true;
  }

  // проверяем расположение корабля на игровом поле
  inField(x, y) {
    const isNumber = (n) =>
      parseInt(n) === n && !isNaN(n) && ![Infinity, -Infinity].includes(n);

    if (!isNumber(x) || !isNumber(y)) {
      return false;
    }

    return 0 <= x && x < 10 && 0 <= y && y < 10;
  }

  // метод присвоения корабля
  addShip(ship, x, y) {
    if (this.ships.includes(ship)) {
      return false;
    }

    this.ships.push(ship);

    if (this.inField(x, y)) {
      const dx = ship.direction === 'row';
      const dy = ship.direction === 'column';

      let placed = true;


      // проверка, находится ли корабль в пределах игрового поля, и проверка соседних ячеек с кораблем
      for (let i = 0; i < ship.size; i++) {
        const cx = x + dx * i;
        const cy = y + dy * i;

        if (!this.inField(cx, cy)) {
          placed = false;
          break;
        }

        const item = this.matrix[cy][cx];
        if (!item.free) {
          placed = false;
          break;
        }
      }

      if (placed) {
        Object.assign(ship, { x, y });
      }
    }

    this._changed = true;
    return true;
  }

  // способ удаления корабля

  removeShip(ship) {
    if (!this.ships.includes(ship)) {
      return false;
    }

    const index = this.ships.indexOf(ship);
    this.ships.splice(index, 1);

    ship.x = null;
    ship.y = null;

    this._changed = true;
    return true;
  }

  removeAllShips() {
    const ships = this.ships.slice();

    for (const ship of ships) {
      this.removeShip(ship);
    }

    return ships.length;
  }

  //  присоедениение выстрела
  addShot(shot) {
    // If the shot on a cell already was, nothing is done
    for (const { x, y } of this.shots) {
      if (x === shot.x && y === shot.y) {
        return false;
      }
    }

    // добавление выстрела в массив
    this.shots.push(shot);

    this._changed = true;

    const matrix = this.matrix;
    const { x, y } = shot;


    // проверка наличия корабля в ячейке
    if (matrix[y][x].ship) {
      shot.setVariant('wounded');

      const { ship } = matrix[y][x];
      const dx = ship.direction === 'row';
      const dy = ship.direction === 'column';

      let killed = true;

      // проверка корабля на наличие неповрежденных палуб
      for (let i = 0; i < ship.size; i++) {
        const cx = ship.x + dx * i;
        const cy = ship.y + dy * i;
        const item = matrix[cy][cx];

        // не все палубы убиты
        if (!item.wounded) {
          killed = false;
          break;
        }
      }

      // все палубы подстрелены
      if (killed) {
        ship.killed = true;

        for (let i = 0; i < ship.size; i++) {
          const cx = ship.x + dx * i;
          const cy = ship.y + dy * i;

          const shot = this.shots.find(
            (shot) => shot.x === cx && shot.y === cy
          );
          shot.setVariant('killed');
        }
      }
    }

    return true;
  }

  removeShot(shot) {
    if (!this.shots.includes(shot)) {
      return false;
    }

    const index = this.shots.indexOf(shot);
    this.shots.splice(index, 1);

    this._changed = true;
    return true;
  }

  removeAllShots() {
    const shots = this.shots.slice();

    for (const shot of shots) {
      this.removeShot(shot);
    }

    return shots.length;
  }

  // случайное размещение кораблей на игровом поле
  randomize(ShipClass = Ship) {
    this.removeAllShips();

    for (let size = 4; size >= 1; size--) {
      for (let n = 0; n < 5 - size; n++) {
        const direction = getRandomFrom('row', 'column');
        const ship = new ShipClass(size, direction);

        while (!ship.placed) {
          const x = getRandomBetween(0, 9);
          const y = getRandomBetween(0, 9);

          this.removeShip(ship);
          this.addShip(ship, x, y);
        }
      }
    }
  }

  clear() {
    this.removeAllShips();
    this.removeAllShots();
  }
}
