import type { IconBaseProps, IconType } from "react-icons";

import {
  FaAlignLeft,
  FaBatteryQuarter,
  FaBell,
  FaBolt,
  FaBook,
  FaBullseye,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartBar,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCommentDots,
  FaDatabase,
  FaEdit,
  FaEllipsisV,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFire,
  FaFlag,
  FaGoogle,
  FaHeartbeat,
  FaHistory,
  FaHome,
  FaListUl,
  FaPalette,
  FaPaperclip,
  FaPaperPlane,
  FaPause,
  FaPaw,
  FaPlay,
  FaPlug,
  FaPlus,
  FaRunning,
  FaSearch,
  FaSignOutAlt,
  FaSpinner,
  FaSyncAlt,
  FaTag,
  FaTimes,
  FaTint,
  FaTrash,
  FaTrophy,
  FaUser,
  FaUserCircle,
  FaUserFriends,
  FaVolumeUp,
} from "react-icons/fa";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiHeart,
  FiPlus,
  FiSettings,
  FiTarget,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import { GoLinkExternal } from "react-icons/go";
import {
  MdClose,
  MdDarkMode,
  MdEvent,
  MdExpandLess,
  MdExpandMore,
  MdFullscreen,
  MdFullscreenExit,
  MdLightMode,
  MdMenu,
  MdOutlineEditNote,
  MdOutlineSchedule,
  MdSettings,
  MdTimer,
  MdVolumeOff,
  MdVolumeUp,
} from "react-icons/md";

// Registro curado de ícones: importações explícitas em vez de
// `import * as` de cada pacote. Importar o pacote inteiro de uma vez
// (react-icons/fa, /md, /fi, /go) intocava o tree-shaking, porque o
// lookup `icons[name]` por símbolo dinâmico mantinha viva toda a
// coleção — milhares de SVGs (dezenas de MB) caiam num chunk comum
// baixado por TODA rota, inclusive Landing e /login. Com a lista
// explícita, só os ícones de fato usados no app entram no bundle.
// Para usar um novo ícone: adicione aqui o import + a entrada abaixo.
const icons = {
  FaAlignLeft,
  FaBatteryQuarter,
  FaBell,
  FaBolt,
  FaBook,
  FaBullseye,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartBar,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCommentDots,
  FaDatabase,
  FaEdit,
  FaEllipsisV,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFire,
  FaFlag,
  FaGoogle,
  FaHeartbeat,
  FaHistory,
  FaHome,
  FaListUl,
  FaPalette,
  FaPaperclip,
  FaPaperPlane,
  FaPause,
  FaPaw,
  FaPlay,
  FaPlug,
  FaPlus,
  FaRunning,
  FaSearch,
  FaSignOutAlt,
  FaSpinner,
  FaSyncAlt,
  FaTag,
  FaTimes,
  FaTint,
  FaTrash,
  FaTrophy,
  FaUser,
  FaUserCircle,
  FaUserFriends,
  FaVolumeUp,
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiHeart,
  FiPlus,
  FiSettings,
  FiTarget,
  FiTrash2,
  FiZap,
  GoLinkExternal,
  MdClose,
  MdDarkMode,
  MdEvent,
  MdExpandLess,
  MdExpandMore,
  MdFullscreen,
  MdFullscreenExit,
  MdLightMode,
  MdMenu,
  MdOutlineEditNote,
  MdOutlineSchedule,
  MdSettings,
  MdTimer,
  MdVolumeOff,
  MdVolumeUp,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof icons;

export interface IconProps extends IconBaseProps {
  name?: IconName;
}

export function Icon({ name, "aria-hidden": ariaHidden, ...props }: IconProps) {
  if (!name) return null;

  const IconComponent = icons[name];

  // Como o registro agora é curado (e não mais todos os ícones do
  // pacote), um `name` desconhecido não deve derrubar a tela — renderiza
  // nada, como um ícone que simplesmente não existe.
  if (!IconComponent) return null;

  // Todo uso de `Icon` no projeto é decorativo (par com texto visível) ou
  // fica dentro de um controle que já tem seu próprio `aria-label` (ver
  // `Button.Preset`) — nenhum lugar depende do ícone em si carregar nome
  // acessível. Antes disso, cada chamador precisava lembrar de passar
  // `aria-hidden="true"` manualmente; esquecimentos (encontrados em
  // auditoria) faziam leitores de tela anunciarem um SVG sem nome. Agora
  // é o padrão, e quem realmente precisar do oposto ainda pode passar
  // `aria-hidden={false}` explicitamente.
  return <IconComponent aria-hidden={ariaHidden ?? true} {...props} />;
}