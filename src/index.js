import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square({ isWinningSquare, id, value, onClick }) {
  const className = [
    'square',
    isWinningSquare ? 'square--is-winning' : '',
  ].join(' ');
  return (
    <button className={className} onClick={() => onClick(id)}>
      {value}
    </button>
  );
}

class Board extends React.Component {
  // - 問題の切り分け（切り出し）が重要
  // - ロジックがこちらと`render`に混在すると見辛い
  // - 処理に伴うロジックをこちらでなく`render`に留める(引数is...の算出等)
  // - こちらではDOMの作成に終始する
  // - ループの入れ子を無くすため、ループごとにまとめる（renderSquare --> renderSquares）
  // - また、いくつループするかはループされる側の問題、、、じゃない場合もあるが…。
  // renderSquare({ id, value, isWinningSquare, onClick }) {
  // }

  // 引数にthis以下のものは持たせず、他のrenderXXXと依存関係をもつもののみの方が関係がわかりやすいかも。
  renderSquares(rowIdx) {
    const { colQty, squares, winningSquares, onClick } = this.props;
    // DOMを作るもの、それに必要なもの
    const doms = [];
    // DOMを作る
    for (let i = 0; i < colQty; i++) {
      // 食い違いが出ないようここで共通化する。
      const id = colQty * rowIdx + i;
      // 一旦、変数domに格納する。`dom.push(...)`の中に書くと見辛い。
      const dom = (
        <Square
          key={id}
          id={id}
          value={squares[id]}
          isWinningSquare={winningSquares.includes(id)}
          onClick={onClick}
        />
      );
      doms.push(dom);
    }
    // DOMまたはその配列を返す
    return (doms);
  };

  renderRows() {
    const { rowQty } = this.props;
    const doms = [];
    for (let i = 0; i < rowQty; i++) {
      const dom = (
        <div className='board__row' key={i}>
          {this.renderSquares(i)}
        </div>
      );
      doms.push(dom);
    }
    return (doms);
  }

  render() {
    return (
      <div className='board'>
        {this.renderRows()}
      </div>
    );
  }
}

class Game extends React.Component {
  state = {
    history: [{
      squares: Array(9).fill(null),
      location: null,
      gameResult: createGameResult({ gameIsOver: false }),
    }],
    crntStepNumber: 0,
    orderIsAsc: true,
  };

  // 固定値や`this.state`から算出する値は、そのロジックがあちこちで食い違いが出ないようここで共通化させる。
  get rowQty() {
    return 3;
  }
  get colQty() {
    return 3;
  }
  get nextPlayer() {
    return this.getPlayer(this.state.crntStepNumber);
  }
  getPlayer(stepNumber) {
    return stepNumber % 2 === 0 ? 'X' : 'O';
  }
  getLocation(i) {
    return [
      Math.floor(i / this.rowQty) + 1,
      i % this.colQty + 1,
    ];
  }

  // イベントハンドラーはここにまとめる。
  handleSquareClick = (i) => {
    const state = this.state;
    const history = state.history.slice(0, state.crntStepNumber + 1);
    const current = history[state.crntStepNumber];
    const squares = current.squares.slice();
    const isInvalidClick = current.gameResult.gameIsOver || squares[i] !== null;
    if (isInvalidClick) {
      return;
    }
    squares[i] = this.nextPlayer;
    this.setState({
      history: [
        ...history,
        {
          squares,
          location: this.getLocation(i),
          gameResult: calculatorGameResult(squares),
        }
      ],
      crntStepNumber: history.length,
    });
  }

  handleMoveClick = (stepNumber) => {
    this.setState({ crntStepNumber: stepNumber });
  }

  handleMoveSortToggle = () => {
    this.setState({ orderIsAsc: !this.state.orderIsAsc });
  }

  // レンダラーはここにまとめる。
  // TODO: `this.state`、ローカル変数、`Array.map`等の引数変数、何が何かわからなくなるのなんとかしたい。
  // - this.state ---> state: 良く使うのでせめてthisを省く
  // - Array.map等の引数変数 ---> Array.map((配列の変数名から1文字とる, indexから1文字とってi) => (/* do something */))
  // - ローカル変数 ---> 前述のものでないネーミングで。おそらくdomsぐらいしかない。
  renderMoves() {
    const state = this.state;
    const doms = state.history.map((h, i) => {
      const desc = i === 0 ?
        'Go to game start' :
        `Go to move #${i} @${h.location}`;
      const dom = (
        <li key={i}>
          <button onClick={() => this.handleMoveClick(i)}>
            {i === state.crntStepNumber ? <b>{desc}</b> : desc}
          </button>
        </li >
      );
      return dom;
    });
    return (doms);
  }

  renderStatus() {
    const state = this.state;
    const gameResult = state.history[state.crntStepNumber].gameResult;
    if (gameResult.gameIsDraw) return 'Game is draw';
    if (gameResult.gameIsOver) return 'Winner: ' + this.getPlayer(state.crntStepNumber - 1);
    return 'Next player: ' + this.nextPlayer;
  }

  render() {
    const state = this.state;
    const history = state.history;
    const current = history[state.crntStepNumber];
    const gameResult = current.gameResult;
    // レンダー部分がループや簡潔でない条件分岐を持つなら切り出してしまう。
    const statusDom = this.renderStatus();
    const moveDoms = this.renderMoves();
    return (
      <div className="game">
        <Board
          rowQty={this.rowQty}
          colQty={this.colQty}
          squares={current.squares}
          winningSquares={gameResult.line ?? []}
          onClick={this.handleSquareClick}
        />
        <div className="game__info">
          <div>{statusDom}</div>
          <button onClick={this.handleMoveSortToggle}>
            Sorted by {state.orderIsAsc ? 'ASC' : 'DESC'}
          </button>
          <ol>{state.orderIsAsc ? moveDoms : moveDoms.reverse()}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function createGameResult({ gameIsOver, gameIsDraw = null, line = null }) {
  return { gameIsOver, gameIsDraw, line };
}

function calculatorGameResult(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return createGameResult({
        gameIsOver: true,
        line: lines[i],
      });
    }
  }

  const gameIsDraw = squares.every(x => !!x);
  if (gameIsDraw) {
    return createGameResult({
      gameIsOver: true,
      gameIsDraw: true,
    });
  }

  return createGameResult({ gameIsOver: false });
}
