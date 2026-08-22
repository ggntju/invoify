"use client";

import { useEffect } from "react";

// React Signature Canvas
import SignatureCanvas from "react-signature-canvas";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

// Components
import { BaseButton, SignatureColorSelector } from "@/app/components";

// Contexts
import { useSignatureContext } from "@/contexts/SignatureContext";

// Icons
import { Check, Eraser } from "lucide-react";

// Types
import { SignatureTabs } from "@/types";

type DrawSignatureProps = {
    handleSaveSignature: () => void;
};

const DrawSignature = ({ handleSaveSignature }: DrawSignatureProps) => {
    const {
        signatureData,
        signatureRef,
        colors,
        selectedColor,
        handleColorButtonClick,
        clearSignature,
        handleCanvasEnd,
    } = useSignatureContext();

    /*
     * A <canvas> has two sizes: its CSS box and its bitmap (width/height
     * attributes, default 300x150). Only the CSS box was being set, so strokes
     * were drawn at a different scale than the pointer — visibly offset, and
     * worse on high-DPI phones. Keep the bitmap in sync with the rendered box,
     * accounting for devicePixelRatio, and restore any existing drawing since
     * resizing a canvas clears it.
     */
    useEffect(() => {
        // The context types signatureRef itself as nullable, not just .current
        const pad = signatureRef?.current;
        const canvas = pad?.getCanvas();
        if (!pad || !canvas) return;

        const resizeCanvas = () => {
            const { width, height } = canvas.getBoundingClientRect();
            if (!width || !height) return;

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const nextWidth = Math.round(width * ratio);
            const nextHeight = Math.round(height * ratio);

            if (canvas.width === nextWidth && canvas.height === nextHeight) {
                return;
            }

            const previous = pad.isEmpty() ? null : pad.toDataURL();

            canvas.width = nextWidth;
            canvas.height = nextHeight;
            canvas.getContext("2d")?.scale(ratio, ratio);

            if (previous) {
                pad.fromDataURL(previous, { width, height });
            } else {
                pad.clear();
            }
        };

        resizeCanvas();

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [signatureRef]);

    return (
        <TabsContent value={SignatureTabs.DRAW}>
            <Card className="border-none shadow-none">
                <CardContent className="space-y-2 p-0">
                    <div className="mx-auto w-full max-w-[600px] touch-none">
                        {/* Signature Canvas to draw signature */}
                        <SignatureCanvas
                            velocityFilterWeight={1} // Adjust the velocityFilterWeight to make the pen lighter
                            minWidth={1.4} // Adjust the minWidth for a finer line
                            maxWidth={1.4} // Adjust the maxWidth for a finer line
                            throttle={0}
                            ref={signatureRef}
                            penColor={selectedColor}
                            canvasProps={{
                                className:
                                    "w-full h-[12rem] sm:h-[15rem] rounded-[10px] touch-none",
                                style: { background: "#efefef" },
                            }}
                            onEnd={handleCanvasEnd}
                        />
                    </div>
                </CardContent>
                <div className="flex justify-between gap-2 pt-2">
                    {/* Color selector */}
                    <SignatureColorSelector
                        colors={colors}
                        selectedColor={selectedColor}
                        handleColorButtonClick={handleColorButtonClick}
                    />

                    {signatureData && (
                        <BaseButton
                            tooltipLabel="Clear the signature board"
                            variant="outline"
                            className="w-fit gap-2"
                            onClick={clearSignature}
                        >
                            Erase
                            <Eraser />
                        </BaseButton>
                    )}
                    <BaseButton
                        tooltipLabel="Save changes"
                        disabled={!signatureData}
                        onClick={handleSaveSignature}
                    >
                        Done
                        <Check />
                    </BaseButton>
                </div>
            </Card>
        </TabsContent>
    );
};

export default DrawSignature;
