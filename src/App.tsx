import "./App.css";
import { useAction, useAtom } from "@reatom/npm-react";
import { action, atom, onConnect, random } from "@reatom/framework";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";
import labPlugin from "colord/plugins/lab";
extend([labPlugin, mixPlugin]);

function getHsl(h = random(0, 360)) {
  return {
    l: 80,
    s: 80,
    a: 80,
    h,
  };
}

function reatomColors() {
  const targetColorAtom = atom("#000", "targetColorAtom");
  const initialColorAtom = atom("#000", "initialColorAtom");
  const _currentColorAtom = atom("#000", "_currentColorAtom");
  const attemptColorAtom = atom("#000", "attemptColorAtom");
  const deltaAtom = atom<null | number>(null, "deltaAtom");

  const attempt = action((ctx) => {
    const currentColor = ctx.get(_currentColorAtom);
    const initialColor = ctx.get(initialColorAtom);
    const attemptColor = attemptColorAtom(
      ctx,
      colord(initialColor).mix(currentColor).toRgbString()
    );
    const targetColor = ctx.get(targetColorAtom);

    deltaAtom(ctx, colord(attemptColor).delta(targetColor));
  }, "attempt");

  const start = action((ctx) => {
    const initialHsl = getHsl();

    const answerHsl = getHsl(initialHsl.h + random(60, 300));

    const targetColor = colord(initialHsl).mix(answerHsl);

    initialColorAtom(ctx, colord(initialHsl).toRgbString());
    targetColorAtom(ctx, targetColor.toRgbString());
    attemptColorAtom(ctx, "transparent");
    deltaAtom(ctx, null);
  }, "start");

  onConnect(initialColorAtom, start);
  onConnect(_currentColorAtom, async (ctx) => {
    while (ctx.isConnected()) {
      await new Promise(requestAnimationFrame);

      _currentColorAtom(ctx, (color) => {
        const hsl = getHsl(colord(color).toHsl().h + 1);

        return colord(hsl).toRgbString();
      });
    }
  });

  return {
    attempt,
    attemptColorAtom,
    currentColorAtom: _currentColorAtom,
    deltaAtom,
    initialColorAtom,
    start,
    targetColorAtom,
  };
}

const {
  attempt,
  attemptColorAtom,
  currentColorAtom,
  deltaAtom,
  initialColorAtom,
  start,
  targetColorAtom,
} = reatomColors();

function Delta() {
  const [delta] = useAtom(deltaAtom);
  const handleStart = useAction(start);
  if (delta === null) return null;

  const percent = 100 - +delta.toFixed(2) * 100;

  return (
    <div className="delta" onClick={handleStart}>
      {percent}% {percent > 80 ? "👍" : "👎"}
    </div>
  );
}

function App() {
  const [targetColor] = useAtom(targetColorAtom);
  const [initialColor] = useAtom(initialColorAtom);
  const [currentColor] = useAtom(currentColorAtom);
  const [attemptColor] = useAtom(attemptColorAtom);
  const [delta] = useAtom(deltaAtom);

  const attemptAction = useAction(attempt);

  return (
    <section className="app">
      <form>
        <div className="square" style={{ background: initialColor }}>
          <span>from</span>
        </div>
        <div
          className="square"
          onClick={attemptAction}
          style={{ background: currentColor }}
        >
          <span>with</span>
        </div>
        <div className="square" style={{ background: targetColor }}>
          {delta === null && <span>to</span>}
          <div className="attempt" style={{ background: attemptColor }} />
        </div>
      </form>
      <Delta />
    </section>
  );
}

export default App;
