import React, { useEffect, useState, useCallback } from "react";
import { useSetCanvasRef } from "recoil/handler";
import { useRecoilState } from "recoil";
import { canvasMouse, clearCanvas } from "./CursorCanvasController/util";
import { cursorCanvasRefsState, bookChangedState, penModeState } from "recoil/atom";

function PageCanvasGroup({ pageNum, pageWrapper }) {
	//여기에서 추가하기
	// const [canvasItems, setCanvasItems] = useState([]);
	const [bookChanged, setBookChanged] = useRecoilState(bookChangedState);
	const [cursorCanvasRefs, setCursorCanvasRefs] = useRecoilState(cursorCanvasRefsState);
	const [penMode, setPenMode] = useRecoilState(penModeState);

	const setRef = useCallback(
		(el) => {
			setCursorCanvasRefs((oldRefs) => {
				// oldRefs 배열을 순회하며, 조건에 맞는 요소를 찾아 업데이트합니다.
				const newRefs = oldRefs.map((ref) => {
					if (ref.page === pageNum) {
						// pageNum과 일치하는 page 속성을 가진 요소를 찾았을 때,
						// 해당 요소의 ref를 업데이트합니다.
						return { ...ref, ref: el };
					}
					// 조건에 맞지 않는 요소는 그대로 반환합니다.
					return ref;
				});
				// console.log("newRefs", newRefs);
				return newRefs;
			});
		},
		[pageNum, bookChanged, setCursorCanvasRefs] // 의존성 배열에 pageNum과 setCursorCanvasRefs를 포함합니다.
	);

	return (
		<div className="page-canvas-group">
			<canvas
				id={`pointer-canvas-${pageNum}`}
				ref={setRef}
				width={pageWrapper.scrollWidth}
				height={pageWrapper.scrollHeight}
				style={{
					border: "1px solid black",
					pointerEvents: "none",
					// pointerEvents: penMode == "pointer" ? "auto" : " none",
					position: "absolute",
					left: 0,
					top: 0,
				}}
				onMouseMove={(e) => canvasMouse(e, pageNum)}
				onMouseOut={(e) => clearCanvas(e.target)}
			></canvas>
			{/* {canvasItems} */}
		</div>
	);
}

export default PageCanvasGroup;
