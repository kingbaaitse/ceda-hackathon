/**
 * Animated icons.
 *
 * `lucide-animated-icons` gives every Lucide glyph a real hover and tap
 * animation - but each icon only animates inside a trigger. We wrap every
 * icon in its own trigger so it reacts to hover and click on its own,
 * without the caller wiring anything up.
 *
 * Export names match `lucide-react`, so a file swaps its import source and
 * nothing else changes.
 */
import { forwardRef, useEffect, useRef } from 'react';
import { AnimatedIconTriggerContext, useAnimatedIconTrigger } from 'lucide-animated-icons/core';

import AlertCircleIcon from 'lucide-animated-icons/icons/circle-alert';
import ArrowLeftIcon from 'lucide-animated-icons/icons/arrow-left';
import ArrowRightIcon from 'lucide-animated-icons/icons/arrow-right';
import AwardIcon from 'lucide-animated-icons/icons/award';
import BellIcon from 'lucide-animated-icons/icons/bell';
import BellRingIcon from 'lucide-animated-icons/icons/bell-ring';
import Building2Icon from 'lucide-animated-icons/icons/building-2';
import CheckIcon from 'lucide-animated-icons/icons/check';
import CheckCircle2Icon from 'lucide-animated-icons/icons/circle-check-big';
import ChevronDownIcon from 'lucide-animated-icons/icons/chevron-down';
import ChevronLeftIcon from 'lucide-animated-icons/icons/chevron-left';
import ChevronRightIcon from 'lucide-animated-icons/icons/chevron-right';
import ClipboardListIcon from 'lucide-animated-icons/icons/clipboard-list';
import ClockIcon from 'lucide-animated-icons/icons/clock';
import DownloadIcon from 'lucide-animated-icons/icons/download';
import ExternalLinkIcon from 'lucide-animated-icons/icons/external-link';
import EyeIcon from 'lucide-animated-icons/icons/eye';
import EyeOffIcon from 'lucide-animated-icons/icons/eye-off';
import FileEditIcon from 'lucide-animated-icons/icons/file-pen';
import FileTextIcon from 'lucide-animated-icons/icons/file-text';
import GitBranchIcon from 'lucide-animated-icons/icons/git-branch';
import HistoryIcon from 'lucide-animated-icons/icons/history';
import InfoIcon from 'lucide-animated-icons/icons/info';
import LayoutDashboardIcon from 'lucide-animated-icons/icons/layout-dashboard';
import LightbulbIcon from 'lucide-animated-icons/icons/lightbulb';
import LockIcon from 'lucide-animated-icons/icons/lock';
import LogOutIcon from 'lucide-animated-icons/icons/log-out';
import MailIcon from 'lucide-animated-icons/icons/mail';
import MapPinIcon from 'lucide-animated-icons/icons/map-pin';
import MenuIcon from 'lucide-animated-icons/icons/menu';
import MessageCircleIcon from 'lucide-animated-icons/icons/message-circle';
import MessageSquareTextIcon from 'lucide-animated-icons/icons/message-square-text';
import MonitorIcon from 'lucide-animated-icons/icons/monitor';
import MoonIcon from 'lucide-animated-icons/icons/moon';
import PhoneIcon from 'lucide-animated-icons/icons/phone';
import PlusIcon from 'lucide-animated-icons/icons/plus';
import RefreshCwIcon from 'lucide-animated-icons/icons/refresh-cw';
import ScrollTextIcon from 'lucide-animated-icons/icons/scroll-text';
import SearchIcon from 'lucide-animated-icons/icons/search';
import SendIcon from 'lucide-animated-icons/icons/send';
import SettingsIcon from 'lucide-animated-icons/icons/settings';
import SlidersHorizontalIcon from 'lucide-animated-icons/icons/sliders-horizontal';
import StarIcon from 'lucide-animated-icons/icons/star';
import SunIcon from 'lucide-animated-icons/icons/sun';
import Trash2Icon from 'lucide-animated-icons/icons/trash-2';
import TrendingUpIcon from 'lucide-animated-icons/icons/trending-up';
import TriangleAlertIcon from 'lucide-animated-icons/icons/triangle-alert';
import UploadCloudIcon from 'lucide-animated-icons/icons/cloud-upload';
import UserIcon from 'lucide-animated-icons/icons/user';
import UserPlusIcon from 'lucide-animated-icons/icons/user-plus';
import UsersIcon from 'lucide-animated-icons/icons/users';
import WifiOffIcon from 'lucide-animated-icons/icons/wifi-off';
import XIcon from 'lucide-animated-icons/icons/x';

/**
 * Wrap an animated icon in its own trigger so it animates on hover and on
 * tap. The wrapper is `display: contents`, so it never changes layout.
 */
function animated(Icon) {
    const Component = forwardRef(function AnimatedIcon(props, ref) {
        const { hub, handlers } = useAnimatedIconTrigger();
        const timer = useRef(null);

        useEffect(() => () => clearTimeout(timer.current), []);

        const tap = () => {
            // `open` replays the hover scene even while the pointer rests on
            // the icon; `rest` first so a second tap replays it again.
            hub.emit('rest');
            hub.emit('open');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => hub.emit('rest'), 900);
        };

        return (
            <AnimatedIconTriggerContext.Provider value={hub}>
                <span
                    {...handlers}
                    style={{ display: 'contents' }}
                    onClick={tap}
                >
                    <Icon {...props} ref={ref} />
                </span>
            </AnimatedIconTriggerContext.Provider>
        );
    });
    Component.displayName = 'AnimatedIcon';
    return Component;
}

export const AlertCircle = animated(AlertCircleIcon);
export const ArrowLeft = animated(ArrowLeftIcon);
export const ArrowRight = animated(ArrowRightIcon);
export const Award = animated(AwardIcon);
export const Bell = animated(BellIcon);
export const BellRing = animated(BellRingIcon);
export const Building2 = animated(Building2Icon);
export const Check = animated(CheckIcon);
export const CheckCircle2 = animated(CheckCircle2Icon);
export const ChevronDown = animated(ChevronDownIcon);
export const ChevronLeft = animated(ChevronLeftIcon);
export const ChevronRight = animated(ChevronRightIcon);
export const ClipboardList = animated(ClipboardListIcon);
export const Clock = animated(ClockIcon);
export const Download = animated(DownloadIcon);
export const ExternalLink = animated(ExternalLinkIcon);
export const Eye = animated(EyeIcon);
export const EyeOff = animated(EyeOffIcon);
export const FileEdit = animated(FileEditIcon);
export const FileText = animated(FileTextIcon);
export const GitBranch = animated(GitBranchIcon);
export const History = animated(HistoryIcon);
export const Info = animated(InfoIcon);
export const LayoutDashboard = animated(LayoutDashboardIcon);
export const Lightbulb = animated(LightbulbIcon);
export const Lock = animated(LockIcon);
export const LogOut = animated(LogOutIcon);
export const Mail = animated(MailIcon);
export const MapPin = animated(MapPinIcon);
export const Menu = animated(MenuIcon);
export const MessageCircle = animated(MessageCircleIcon);
export const MessageSquareText = animated(MessageSquareTextIcon);
export const Monitor = animated(MonitorIcon);
export const Moon = animated(MoonIcon);
export const Phone = animated(PhoneIcon);
export const Plus = animated(PlusIcon);
export const RefreshCw = animated(RefreshCwIcon);
export const ScrollText = animated(ScrollTextIcon);
export const Search = animated(SearchIcon);
export const Send = animated(SendIcon);
export const Settings = animated(SettingsIcon);
export const SlidersHorizontal = animated(SlidersHorizontalIcon);
export const Star = animated(StarIcon);
export const Sun = animated(SunIcon);
export const Trash2 = animated(Trash2Icon);
export const TrendingUp = animated(TrendingUpIcon);
export const TriangleAlert = animated(TriangleAlertIcon);
export const UploadCloud = animated(UploadCloudIcon);
export const User = animated(UserIcon);
export const UserPlus = animated(UserPlusIcon);
export const Users = animated(UsersIcon);
export const WifiOff = animated(WifiOffIcon);
export const X = animated(XIcon);
