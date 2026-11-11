/* CEDA official logo mark. Full logos are also available:
   ceda-full-logo-with-tagline.png · ceda-logo-without-tagline.png */
import icon from '../assets/img/ceda-full-logo-icon.png';
import fullLogoTagline from '../assets/img/ceda-full-logo-with-tagline.png';
import fullLogoNoTagline from '../assets/img/ceda-logo-without-tagline.png';

export default function Logo({ className = 'w-7 h-7' }) {
  return <img src={icon} alt="CEDA" className={`${className} object-contain`} />;
}

export { icon as cedaIcon, fullLogoTagline, fullLogoNoTagline };
