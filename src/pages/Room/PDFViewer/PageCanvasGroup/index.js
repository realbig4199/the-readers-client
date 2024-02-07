import React, { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { useSetCanvasRef } from "recoil/handler";
import { useRecoilState } from "recoil";
import { canvasMouse, clearCanvas } from "./CursorCanvasController/util";
import { getCanvasRef } from "./DrawingCanvasController/util";
import {
	cursorCanvasRefsState,
	drawingCanvasRefsState,
	bookChangedState,
	penModeState,
	userState,
	roomUserState,
	roomUsersState,
} from "recoil/atom";
import { useParams, useNavigate } from "react-router-dom";
import { set } from "lodash";
import rough from "roughjs/bundled/rough.esm";
import socket from "socket";

function PageCanvasGroup({ pageNum, pageWrapper }) {
	const { bookId, roomId } = useParams();
	// 여기에서 추가하기
	const [canvasItems, setCanvasItems] = useState([]);

	const [roomUser, setRoomUser] = useRecoilState(roomUserState);
	const [roomUsers, setRoomUsers] = useRecoilState(roomUsersState);
	const [bookChanged, setBookChanged] = useRecoilState(bookChangedState);
	const [cursorCanvasRefs, setCursorCanvasRefs] = useRecoilState(cursorCanvasRefsState);
	const [drawingCanvasRefs, setDrawingCanvasRefs] = useRecoilState(drawingCanvasRefsState);

	const [penMode, setPenMode] = useRecoilState(penModeState);
	const [user, setUser] = useRecoilState(userState);

	const location = {
		bookId: bookId,
		roomId: roomId,
		pageNum: pageNum,
	};

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
				return newRefs;
			});
		},
		[pageNum, bookChanged, setCursorCanvasRefs] // 의존성 배열에 pageNum과 setCursorCanvasRefs를 포함합니다.
	);

	const isAllRefSet = (refs) =>
		refs.every((pageRef) => {
			// console.log(pageRef);
			return Object.values(pageRef.userRefs).every((userRef) => {
				// console.log(userRef.current);
				return userRef.current != null;
			});
		});

	const setDrawingRef = useCallback(
		(el, userId) => {
			setDrawingCanvasRefs((oldRefs) => {
				let flag = isAllRefSet(oldRefs);
				// console.log("length", oldRefs.length, "flag", flag);
				if (flag && oldRefs.length > 0) {
					// console.log(oldRefs);
					console.log("All refs are set");
					return oldRefs;
				}
				// oldRefs 배열을 순회하며, 조건에 맞는 요소를 찾아 업데이트합니다.
				const newRefs = oldRefs.map((pageRef) => {
					if (pageRef.page === pageNum) {
						let newUserRefs = { ...pageRef.userRefs };
						if (!newUserRefs[userId].current) {
							newUserRefs[userId] = { current: el };
						}
						// pageNum과 일치하는 page 속성을 가진 요소를 찾았을 때,
						// userId와 일치하는 user 속성을 가진 요소를 찾았을 때,
						// 해당 요소의 ref를 업데이트합니다.
						return { ...pageRef, userRefs: newUserRefs };
					}
					// 조건에 맞지 않는 요소는 그대로 반환합니다.
					return pageRef;
				});
				// console.log("newRefs", el, pageNum, userId);
				// console.log("newRefs", newRefs);
				return newRefs;
			});
		},
		[setDrawingCanvasRefs] // 의존성 배열에 pageNum과 setDrawingCanvasRefs를 포함합니다.
	);

	const info = { userId: user, bookId: bookId, pageNum: pageNum };

	return (
		<div className="page-canvas-group">
			<canvas
				id={`pointer-canvas-${pageNum}`}
				ref={setRef}
				width={pageWrapper.scrollWidth}
				height={pageWrapper.scrollHeight}
				style={{
					border: "1px solid black",
					// pointerEvents: "none",
					pointerEvents: penMode == "pointer" ? "auto" : " none",
					position: "absolute",
					left: 0,
					top: 0,
				}}
				// onMouseMove={(e) => {
				// 	canvasMouse(e, roomUser, location);
				// }}
				onMouseMove={(e) => canvasMouse(e, info)}
				onMouseOut={(e) => clearCanvas(e.target)}
			></canvas>
			<DrawingCanvases
				pageNum={pageNum}
				roomUsers={roomUsers}
				pageWrapper={pageWrapper}
				setDrawingRef={setDrawingRef}
			/>
		</div>
	);
}

const generator = rough.generator();
const tool = "pencil";
const color = "black";
function DrawingCanvases({ pageNum, roomUsers, pageWrapper, setDrawingRef }) {
	const [drawingCanvasRefs, setDrawingCanvasRefs] = useRecoilState(drawingCanvasRefsState);
	const [bookChanged, setBookChanged] = useRecoilState(bookChangedState);
	const [penMode, setPenMode] = useRecoilState(penModeState);
	const [user, setUser] = useRecoilState(userState);
	const [isDrawing, setIsDrawing] = useState(false);
	const [elements, setElements] = useState([]);
	const { bookId, roomId } = useParams();
	const location = {
		bookId: bookId,
		roomId: roomId,
		pageNum: pageNum,
	};

	useLayoutEffect(() => {
		if (drawingCanvasRefs.length === 0) return;
		const canvasRef = getCanvasRef(drawingCanvasRefs, pageNum, user.id);
		if (!canvasRef) {
			console.log("can't find canvasRef");
			return;
		}
		const roughCanvas = rough.canvas(canvasRef);
		if (elements.length > 0) {
			canvasRef.getContext("2d").clearRect(0, 0, canvasRef.width, canvasRef.height);
		}
		elements.forEach((ele, i) => {
			if (ele.element === "rect") {
				roughCanvas.draw(
					generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
						stroke: ele.stroke,
						roughness: 0,
						strokeWidth: 5,
					})
				);
			} else if (ele.element === "line") {
				roughCanvas.draw(
					generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
						stroke: ele.stroke,
						roughness: 0,
						strokeWidth: 5,
					})
				);
			} else if (ele.element === "pencil") {
				roughCanvas.linearPath(ele.path, {
					stroke: ele.stroke,
					roughness: 0,
					strokeWidth: 5,
				});
			}
		});
		const canvasImage = canvasRef.toDataURL();
		const data = {
			userId: user.id,
			location,
			canvasImage,
		};
		// console.log("location", location.roomId);
		// console.log("data", data);
		socket.emit("drawing", data);
	}, [drawingCanvasRefs.length, elements, user]);

	const drawMouseDown = (e) => {
		const { offsetX, offsetY } = e.nativeEvent;

		if (tool === "pencil") {
			setElements((prevElements) => [
				...prevElements,
				{
					offsetX,
					offsetY,
					path: [[offsetX, offsetY]],
					stroke: color,
					element: tool,
				},
			]);
		} else {
			setElements((prevElements) => [...prevElements, { offsetX, offsetY, stroke: color, element: tool }]);
		}

		setIsDrawing(true);
	};

	const drawMouseMove = (e) => {
		if (!isDrawing) {
			return;
		}
		const { offsetX, offsetY } = e.nativeEvent;

		if (tool === "rect") {
			setElements((prevElements) =>
				prevElements.map((ele, index) =>
					index === elements.length - 1
						? {
								offsetX: ele.offsetX,
								offsetY: ele.offsetY,
								width: offsetX - ele.offsetX,
								height: offsetY - ele.offsetY,
								stroke: ele.stroke,
								element: ele.element,
							}
						: ele
				)
			);
		} else if (tool === "line") {
			setElements((prevElements) =>
				prevElements.map((ele, index) =>
					index === elements.length - 1
						? {
								offsetX: ele.offsetX,
								offsetY: ele.offsetY,
								width: offsetX,
								height: offsetY,
								stroke: ele.stroke,
								element: ele.element,
							}
						: ele
				)
			);
		} else if (tool === "pencil") {
			setElements((prevElements) =>
				prevElements.map((ele, index) =>
					index === elements.length - 1
						? {
								offsetX: ele.offsetX,
								offsetY: ele.offsetY,
								path: [...ele.path, [offsetX, offsetY]],
								stroke: ele.stroke,
								element: ele.element,
							}
						: ele
				)
			);
		}
	};

	const drawMouseUp = () => {
		setIsDrawing(false);
	};

	return (
		<>
			{roomUsers.map((roomUser, i) => (
				<canvas
					key={`drawing-canvas-${i}`}
					id={`drawing-canvas-${pageNum}-${roomUser.userId}`}
					ref={(el) => setDrawingRef(el, roomUser.userId)}
					width={pageWrapper.scrollWidth}
					height={pageWrapper.scrollHeight}
					style={{
						border: "1px solid black",
						// pointerEvents: "none",
						// pointerEvents: penMode =="draw" && user id랑 같은지
						// pointerEvents: penMode == "draw" ? "auto" : " none",
						// TODO: 본인 id가 아니면 mouseEvent 없애야 함.
						pointerEvents: penMode == "draw" && roomUser.userId == user.id ? "auto" : "none",
						position: "absolute",
						left: 0,
						top: 0,
					}}
					onMouseDown={drawMouseDown}
					onMouseMove={drawMouseMove}
					onMouseUp={drawMouseUp}
				></canvas>
			))}
		</>
	);
}

export default PageCanvasGroup;
