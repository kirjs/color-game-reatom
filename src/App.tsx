import "./App.css";
import { useAction, useAtom } from "@reatom/npm-react";
import { action, atom, onConnect, random, take} from "@reatom/framework";
import { colord, extend } from "colord";
import { useState } from "react";
import mixPlugin from "colord/plugins/mix";
import labPlugin from "colord/plugins/lab";
extend([labPlugin, mixPlugin]);

function reatomColors() {
  console.log('hi')
  
  const targetColorAtom = atom("#000", "targetAtom");
  const initialColorAtom = atom("#000", "initialAtom");  
  const currentColorAtom = atom("#000", "currentColorAtom");
  const attemptColorAtom = atom("#000", "initialAtom");

  const deltaAtom = atom(0, "deltaAtom");
  

  const attempt = action((ctx) => {
    console.log('attempt')
    const currentColor = attemptColorAtom(ctx, ctx.get(currentColorAtom));
    // const targetColor = ctx.get(targetColorAtom)
    const initialColor = ctx.get(initialColorAtom)
    const attemptColor = attemptColorAtom(ctx, colord(initialColor).mix(currentColor).toRgbString());
    const targetColor = ctx.get(targetColorAtom);

    deltaAtom(ctx, colord(attemptColor).delta(targetColor));          
  });

  const generateTargetColor = action((ctx) => {
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


  });

  const generateNewColorClick = action();
  onConnect(initialColorAtom, generateTargetColor);
  onConnect(currentColorAtom, async (ctx) => {
    while (ctx.isConnected()) {
      await take(ctx, generateNewColorClick);

      currentColorAtom(ctx, (color) => {
        const hsl = colord(color).toHsl();
        hsl.h += Math.random() * 30;
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
    currentColorAtom,
    attemptColorAtom,
    generateNewColorClick,
  };
}

function App() {
  const [
    { targetAtom, attempt, initialAtom, generateNewColorClick, currentColorAtom, attemptColorAtom },
  ] = useState(reatomColors);
  const [targetColor] = useAtom(targetAtom);
  const [initialColor] = useAtom(initialAtom);
  const [currentColor] = useAtom(currentColorAtom);
  const [attemptColor] = useAtom(attemptColorAtom);  
  const attemptAction = useAction(attempt);
  const generateNewColorClickAction = useAction(generateNewColorClick);


  return (<div className="App">
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
