import "./App.css";
import { useAction, useAtom } from "@reatom/npm-react";
import { action, atom, onConnect, random } from "@reatom/framework";
import { colord, extend } from "colord";
import { useState } from "react";
import mixPlugin from "colord/plugins/mix";
import labPlugin from "colord/plugins/lab";
extend([labPlugin, mixPlugin]);

function reatomColors() {
  console.log("hi");

  const targetColorAtom = atom("#000", "targetColorAtom");
  const initialColorAtom = atom("#000", "initialColorAtom");
  const _currentColorAtom = atom("#000", "_currentColorAtom");
  const attemptColorAtom = atom("#000", "attemptColorAtom");

  const deltaAtom = atom(0, "deltaAtom");

  const attempt = action((ctx) => {
    console.log("attempt");
    const currentColor = attemptColorAtom(ctx, ctx.get(_currentColorAtom));
    const initialColor = ctx.get(initialColorAtom);
    const attemptColor = attemptColorAtom(
      ctx,
      colord(initialColor).mix(currentColor).toRgbString()
    );
    const targetColor = ctx.get(targetColorAtom);

    const delta = deltaAtom(ctx, colord(attemptColor).delta(targetColor));
    if (delta < 0.2) {
      alert(`You are a genius ${delta} 🥕`);
    } else {
      alert(`Try again ${delta} 🥕`);
    }

    generateTargetColor(ctx);
  }, "attempt");

  const generateTargetColor = action((ctx) => {
    console.log("GTC");
    const initialHsl = {
      l: 50,
      s: 50,
      a: 50,
      h: random(0, 360),
    };

    const answerHsl = {
      l: 50,
      s: 50,
      a: 50,
      h: random(0, 360),
    };

    const targetColor = colord(initialHsl).mix(answerHsl);

    initialColorAtom(ctx, colord(initialHsl).toRgbString());
    targetColorAtom(ctx, targetColor.toRgbString());
  }, "generateTargetColor");

  const generateNewColorClick = action("generateNewColorClick");
  onConnect(initialColorAtom, generateTargetColor);
  onConnect(_currentColorAtom, async (ctx) => {
    while (ctx.isConnected()) {
      await new Promise(requestAnimationFrame);

      _currentColorAtom(ctx, (color) => {
        const hsl = colord(color).toHsl();
        hsl.h += Math.random() * 1;
        hsl.l = 80;
        hsl.s = 80;
        hsl.a = 50;

        return colord(hsl).toRgbString();
      });
    }
  });

  return {
    targetAtom: targetColorAtom,
    attempt,
    initialAtom: initialColorAtom,
    currentColorAtom: _currentColorAtom,
    attemptColorAtom,
    generateNewColorClick,
    deltaAtom,
  };
}

function App() {
  const [
    {
      targetAtom,
      attempt,
      initialAtom,
      generateNewColorClick,
      currentColorAtom,
      attemptColorAtom,
      deltaAtom,
    },
  ] = useState(reatomColors);
  const [targetColor] = useAtom(targetAtom);
  const [initialColor] = useAtom(initialAtom);
  const [currentColor] = useAtom(currentColorAtom);
  const [attemptColor] = useAtom(attemptColorAtom);
  const [delta] = useAtom(deltaAtom);

  const attemptAction = useAction(attempt);
  const generateNewColorClickAction = useAction(generateNewColorClick);

  return (
    <div className="App">
      <div>Yogurt: {delta}</div>
      <section>
        from this:
        <div className="square" style={{ background: initialColor }}></div>
        and this:
        <div
          className="square"
          onClick={attemptAction}
          style={{ background: currentColor }}
        ></div>
        get this:
        <div className="square" style={{ background: targetColor }}></div>
        Attempt:
        <div className="square" style={{ background: attemptColor }}></div>
      </section>
      <button onClick={generateNewColorClickAction}>Generate color</button>
    </div>
  );
}

export default App;
