import { framer, CanvasNode, supportsBackgroundColor } from "framer-plugin"
import { useState, useEffect } from "react"
import { Stepper } from "./Stepper"
import { calculateShades, calculateTints, getAbsolutePosition } from "./utilities"
import "./App.css"

framer.showUI({
    position: "top right",
    width: 260, 
    height: 345,
})

function useSelection() {
    const [selection, setSelection] = useState<CanvasNode[]>([])

    useEffect(() => {
        return framer.subscribeToSelection(setSelection)
    }, [])

    return selection
}

// Row for the Plugin UI
function Row({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <div className="row">
            <label>{title}</label>
            {children}
        </div>
    )
}

type SelectionPosition = {
    x: number;
    y: number;
}

type AppState = {
    selectedColor: string | null | undefined;
    selectionAbsoluteXY: SelectionPosition | null;
    numberOfTints: number;
    numberOfShades: number;
    name: string | null;
}

export function App() {
    const selection = useSelection()
    const [state, setState] = useState<AppState>({
        selectedColor: null,
        selectionAbsoluteXY: null,
        numberOfTints: 4,
        numberOfShades: 4,
        name: null,
    })

    useEffect(() => {
        // Check if first node has a background color and set selectedColor.
        const color = selection.length > 0 && supportsBackgroundColor(selection[0])
            ? selection[0].backgroundColor?.toString()
            : null;
        
            setState(prev => ({
                ...prev,
                selectedColor: color,
            }));

        // Determine absolute position of selection on the Canvas.
        const fetchLocation = async () => {
          if(selection[0]){
              const absoluteXY = await getAbsolutePosition(selection[0])
              setState(prev => ({
                ...prev,
                selectionAbsoluteXY: absoluteXY,
            }))
          }
        } 

        fetchLocation()
    }, [selection]);
    
    
    const handleAddToCanvas = async () => {
        const { selectedColor, selectionAbsoluteXY, numberOfTints, numberOfShades, name } = state;

        // Calculate the total number of colors.
        const totalColors = numberOfShades + 1 + numberOfTints; 

        // Calculate the shades and tints. (We know selectedColor is string because button is enabled.)
        const shades = calculateShades(selectedColor as string, numberOfShades)
        const tints = calculateTints(selectedColor as string, numberOfTints)
    
        // Create the parent FrameNode with height based on the total colors
        const parent = await framer.createFrameNode({
            name: `${name? name : "Unnamed"} - Shades and Tints`,
            height: `${totalColors * 100}px`,            
            width: `100px`,
            left: `${selectionAbsoluteXY? selectionAbsoluteXY.x : 0}px`,
            top: `${selectionAbsoluteXY? selectionAbsoluteXY.y + 150 : 0}px`,
        });
    
        // Create FrameNode for each shade
        for (let i = 0; i < numberOfShades; i++) {
            await framer.createFrameNode({
                name: `${name? name : "Unnamed"} ${totalColors - i}`,
                height: "100px",
                width: "100px",
                position: "absolute",
                top: `${i * 100}px`,
                backgroundColor: `${shades[i]}`,
            }, parent?.id);
        }
    
        // Create FrameNodes for the selected color
        if (selectedColor) {
            await framer.createFrameNode({
                name: `${name? name : "Unnamed"} ${totalColors - numberOfShades} (Base)`,
                height: "100px",
                width: "100px",
                position: "absolute",
                top: `${numberOfShades * 100}px`, // Position after all shades
                backgroundColor: selectedColor,
            }, parent?.id);
        }
    
        // Create frame nodes for each tint
        for (let i = 0; i < numberOfTints; i++) {
            await framer.createFrameNode({
                name: `${name? name : "Unnamed"} ${numberOfTints - i}`,
                height: "100px",
                width: "100px",
                position: "absolute",
                top: `${(numberOfShades + 1 + i) * 100}px`, // Position after selected color
                backgroundColor: `${tints[i]}`,
            }, parent?.id);
        }
    };

    const handleAddColorStyles = async () => {
        const { selectedColor, numberOfTints, numberOfShades, name } = state;

        // Calculate the total number of colors.
        const totalColors = numberOfShades + 1 + numberOfTints; 

        // Calculate the shades and tints. (We know selectedColor is string because button is enabled.)
        const shades = calculateShades(selectedColor as string, numberOfShades)
        const tints = calculateTints(selectedColor as string, numberOfTints)

        for (let i = 0; i < numberOfShades; i++) {
            await framer.createColorStyle({
                name: `${name? name : "Unnamed"} ${totalColors - i}`,
                light: `${shades[i]}`,
            })
        }

        await framer.createColorStyle({
            name: `${name? name : "Unnamed"} ${totalColors - numberOfShades} (Base)`,
            light: selectedColor as string,
        })

        for (let i = 0; i < numberOfTints; i++) {
            await framer.createColorStyle({
                name: `${name? name : "Unnamed"} ${numberOfTints - i}`,
                light: `${tints[i]}`,
            })
        }


    }

    return (
        <main>
            <p>
                Effortlessly add Shades and Tints to the Canvas.
            </p>
            <div className="framer-divider"></div>
            <div 
                className="color-display"
                style={{ backgroundColor: state.selectedColor || "var(--framer-color-bg-tertiary)"}}>
                    {!state.selectedColor &&
                    <p style={{
                        textAlign: "center",
                        textWrap: "balance"
                        }}>Select a layer on the Canvas with a background fill</p>}
                </div>
            <Row title={"Shades"}>
                <Stepper
                    value={state.numberOfShades}
                    min={1}
                    max={10}
                    onChange={value => {
                        setState(prev => ({ ...prev, numberOfShades: value }))
                    }}
                />
            </Row>
            <Row title={"Tints"}>
                <Stepper
                    value={state.numberOfTints}
                    min={1}
                    max={10}
                    onChange={value => {
                        setState(prev => ({ ...prev, numberOfTints: value }))
                    }}
                />
            </Row>
            <Row title={"Name"}>
                <input 
                    type="text"
                    placeholder="e.g. Primary"
                    value={state.name? state.name : ""}
                    onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                />
            </Row>
            <button
                className="framer-button-primary"
                onClick={handleAddColorStyles}
                disabled={!state.selectedColor}>
                Add Color Styles
            </button>
            <button
                className="framer-button-secondary"
                onClick={handleAddToCanvas}
                disabled={!state.selectedColor}>
                Add to Canvas
            </button>
        </main>
    )
}
