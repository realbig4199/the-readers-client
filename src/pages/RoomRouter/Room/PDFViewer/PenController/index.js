import React, { useEffect, useRef } from "react";
import { Box, Button } from "@mui/material";
import { useRecoilState } from "recoil";
import { viewerScaleState, userState, penModeState, widthState, drawerFormState } from "recoil/atom";
import { Pointer, Highlighter, PencilLine, MousePointerClick, Eraser, ZoomIn, ZoomOut } from "lucide-react";
import AttentionButton from "./AttentionButton";
import { offerLogin } from "components/Header/SideDrawer/utils";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
const buttonSx = { padding: 0, width: "50px", height: "50px" };

export default function PenController() {
	const [mode, setMode] = useRecoilState(penModeState);
	const [user, setUser] = useRecoilState(userState);
	const [drawerForm, setDrawerForm] = useRecoilState(drawerFormState);

	// 펜 컨트롤러의 길이를 계산해 브라우저 가운데 넣기 위하여 추가한 코드
	const [width, setWidth] = useRecoilState(widthState); // 요소의 너비를 저장할 상태
	const ref = useRef(null); // 요소에 대한 참조를 생성

	const handleChange = (event, newMode) => {
		if (!user) {
			offerLogin(user, setDrawerForm);
			return;
		}
		if (newMode !== null) {
			setMode(newMode);
		}
	};

	useEffect(() => {
		// ref.current는 참조된 DOM 요소를 가리킵니다. 요소가 마운트된 후에 너비를 읽어옵니다.
		if (ref.current) {
			setWidth(ref.current.offsetWidth); // 요소의 offsetWidth를 통해 너비를 얻음
		}

		// 선택적으로, 브라우저 리사이즈 이벤트에 따라 너비를 업데이트할 수 있습니다.
		const handleResize = () => {
			if (ref.current) {
				setWidth(ref.current.offsetWidth);
			}
		};

		window.addEventListener("resize", handleResize);

		// 컴포넌트가 언마운트될 때 이벤트 리스너를 정리합니다.
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		console.log(mode);
	}, [mode]);

	return (
		<Box
			ref={ref}
			sx={{
				backgroundColor: "#f7f7f7",
				borderRadius: "8px",
				border: "1px solid #ddd",
				overflow: "hidden",
			}}
		>
			<ToggleButtonGroup orientation="horizontal" value={mode} exclusive onChange={handleChange} aria-label="Mode">
				<ToggleButton value="highlight" aria-label="highlight" sx={buttonSx}>
					<Highlighter />
				</ToggleButton>
				<ToggleButton value="pencil" aria-label="pencil" sx={buttonSx}>
					<PencilLine />
				</ToggleButton>
				<ToggleButton value="pointer" aria-label="pointer" sx={buttonSx}>
					<Pointer />
				</ToggleButton>
				<ToggleButton value="eraser" aria-label="eraser" sx={buttonSx}>
					<Eraser />
				</ToggleButton>
				<ZoomOutButton />
				<ZoomInButton />
				<AttentionButton />
			</ToggleButtonGroup>
		</Box>
	);
}

const ZoomInButton = () => {
	const [scale, setScale] = useRecoilState(viewerScaleState);
	const handleZoomIn = () => {
		setScale((prev) => prev * 1.1);
	};
	return (
		<Button color="inherit" value="zoom-in" aria-label="zoom-in" sx={buttonSx} onClick={handleZoomIn}>
			<ZoomIn />
		</Button>
	);
};

const ZoomOutButton = () => {
	const [scale, setScale] = useRecoilState(viewerScaleState);
	const handleZoomOut = () => {
		setScale((prev) => prev / 1.1);
	};
	return (
		<Button color="inherit" value="zoom-out" aria-label="zoom-out" sx={buttonSx} onClick={handleZoomOut}>
			<ZoomOut />
		</Button>
	);
};
