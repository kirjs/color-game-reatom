import "./App.css";
import { useAction, useAtom } from "@reatom/npm-react";
import {
  action,
  atom,
  onConnect,
  random,
  sleep,
  take,
} from "@reatom/framework";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";
import labPlugin from "colord/plugins/lab";
import a11yPlugin from "colord/plugins/a11y";
import { withLocalStorage } from "@reatom/persist-web-storage";
extend([labPlugin, mixPlugin, a11yPlugin]);

function getHsl(h = random(0, 360)) {
  return {
    l: 80,
    s: 100,
    h,
  };
}

function isWin(delta: number) {
  return delta <= 0.11;
}

function reatomColors() {
  const targetColorAtom = atom("#000", "targetColorAtom");
  const initialColorAtom = atom("#000", "initialColorAtom");
  const answerColorAtom = atom("#000", "answerColorAtom");
  const _currentColorAtom = atom("#000", "_currentColorAtom");
  const attemptColorAtom = atom("#000", "attemptColorAtom");
  const deltaAtom = atom<null | number>(null, "deltaAtom");
  const speedAtom = atom(2, "speedAtom");

  const maxScoreAtom = atom(
    (ctx, state = 2) => Math.max(ctx.spy(speedAtom), state),
    "maxScoreAtom"
  ).pipe(withLocalStorage("maxScoreAtom"));

  const attempt = action((ctx) => {
    if (ctx.get(deltaAtom) !== null) {
      start(ctx);
      return;
    }

    const currentColor = ctx.get(_currentColorAtom);
    const initialColor = ctx.get(initialColorAtom);
    const targetColor = ctx.get(targetColorAtom);
    const attemptColor = attemptColorAtom(
      ctx,
      colord(initialColor).mix(currentColor).toRgbString()
    );

    const delta = colord(attemptColor).delta(targetColor);
    deltaAtom(ctx, delta);

    speedAtom(ctx, (state) => {
      const shift = isWin(delta) ? 0.4 : -0.2;
      return Math.max(0.5, +(state + shift).toFixed(1));
    });
  }, "attempt");

  const start = action((ctx) => {
    const initialHsl = getHsl();

    const answerColor = colord(getHsl(initialHsl.h + random(120, 240)));

    const targetColor = colord(initialHsl).mix(answerColor);

    targetColorAtom(ctx, targetColor.toRgbString());
    initialColorAtom(ctx, colord(initialHsl).toRgbString());
    answerColorAtom(ctx, answerColor.toRgbString());
    attemptColorAtom(ctx, "transparent");
    deltaAtom(ctx, null);
  }, "start");

  onConnect(initialColorAtom, start);
  onConnect(_currentColorAtom, async (ctx) => {
    alert(
      "Tap on the screen to stop color wheel. Then tap again to start it. Try to get as close as possible to the target color. Good luck! 🍀"
    );

    while (ctx.isConnected()) {
      const paused = await Promise.race([
        sleep(50).then(() => false),
        take(ctx, attempt).then(() => true),
      ]);

      if (paused) await take(ctx, start);

      _currentColorAtom(ctx, (color) => {
        const speed = ctx.get(speedAtom);
        const hsl = getHsl(colord(color).toHsl().h + speed);

        return colord(hsl).toRgbString();
      });
    }
  });

  return {
    answerColorAtom,
    attempt,
    attemptColorAtom,
    currentColorAtom: _currentColorAtom,
    deltaAtom,
    initialColorAtom,
    maxScoreAtom,
    speedAtom,
    targetColorAtom,
  };
}

const model = reatomColors();

function Delta() {
  const [delta] = useAtom(model.deltaAtom);
  if (delta === null) return null;

  const percent = 100 - +delta.toFixed(2) * 100;

  return (
    <div className="delta">
      {percent}% {isWin(delta) ? "👍" : "👎"}
    </div>
  );
}

function App() {
  const [targetColor] = useAtom(model.targetColorAtom);
  const [initialColor] = useAtom(model.initialColorAtom);
  const [answerColor] = useAtom(model.answerColorAtom);
  const [attemptColor] = useAtom(model.attemptColorAtom);
  const [currentColor] = useAtom(model.currentColorAtom);
  const [maxScore] = useAtom(model.maxScoreAtom);
  const [speed] = useAtom(model.speedAtom);
  const [delta] = useAtom(model.deltaAtom);

  const attemptAction = useAction(model.attempt);

  return (
    <section className="app" onClick={attemptAction}>
      <form>
        <div className="square" style={{ background: initialColor }}>
          <span>from</span>
          <Delta />
        </div>
        <div className="square" style={{ background: currentColor }}>
          {delta === null ? (
            <div className="speed">
              <span>with</span>
              <span>speed: {speed}</span>
              <span>max: {maxScore}</span>
            </div>
          ) : (
            <>
              <span className="result" style={{ background: answerColor }}>
                will
              </span>
              <span className="result" style={{ background: currentColor }}>
                your
              </span>
            </>
          )}
        </div>
        <div className="square" style={{ background: targetColor }}>
          {delta === null ? (
            <span>to</span>
          ) : (
            <>
              <span className="result" style={{ background: targetColor }}>
                be
              </span>
              <span className="result" style={{ background: attemptColor }}>
                your
              </span>
            </>
          )}
        </div>
      </form>
    </section>
  );
}

export default App;
