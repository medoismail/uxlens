export function HeroIcons() {
  return (
    <svg
      width="210"
      height="120"
      viewBox="0 0 1929 1100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        .anim-left {
          transform-origin: 418px 671px;
          animation: heroSlideLeft 13s infinite, heroFade 13s infinite;
        }
        .anim-right {
          transform-origin: 1516px 674px;
          animation: heroSlideRight 13s infinite, heroFade 13s infinite;
        }
        .spark {
          animation: heroPopSpark 13s infinite;
        }
        .floating {
          animation: heroFloat 6s ease-in-out infinite;
        }
        .floating-delay {
          animation: heroFloat 6s ease-in-out infinite;
          animation-delay: -3s;
        }
        .floating-center {
          animation: heroFloat 8s ease-in-out infinite;
          animation-delay: -1s;
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes heroSlideLeft {
          0% {
            transform: translateX(500px) scale(0.6);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          7.69%, 92.3% {
            transform: translateX(0) scale(1);
            animation-timing-function: cubic-bezier(0.8, 0, 0.8, 0.2);
          }
          100% {
            transform: translateX(500px) scale(0.6);
          }
        }
        @keyframes heroSlideRight {
          0% {
            transform: translateX(-500px) scale(0.6);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          7.69%, 92.3% {
            transform: translateX(0) scale(1);
            animation-timing-function: cubic-bezier(0.8, 0, 0.8, 0.2);
          }
          100% {
            transform: translateX(-500px) scale(0.6);
          }
        }
        @keyframes heroFade {
          0% { opacity: 0; }
          3%, 97% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes heroPopSpark {
          0% { transform: scale(0); opacity: 0; }
          7.69% {
            transform: scale(0); opacity: 0;
            animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          11.53% { transform: scale(1); opacity: 1; }
          88.46% {
            transform: scale(1); opacity: 1;
            animation-timing-function: cubic-bezier(0.36, 0, 0.66, -0.56);
          }
          92.3% { transform: scale(0); opacity: 0; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>

      <defs>
        <filter id="hif0" x="31.3131" y="338.241" width="775.256" height="667.087" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="81.1433"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="e1"/><feBlend mode="normal" in="SourceGraphic" in2="e1" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="12.4743"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e2"/></filter>
        <filter id="hif1" x="1149.55" y="293.918" width="735.224" height="763.864" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="67"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0.921572 0 0 0 0 0.950936 0 0 0 0 0.972959 0 0 0 1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="e1"/><feBlend mode="normal" in="SourceGraphic" in2="e1" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e2"/></filter>
        <filter id="hif2" x="1380.31" y="570.424" width="276.1" height="205.604" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif3" x="648" y="163" width="633" height="617" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif4" x="1523.37" y="84.6777" width="108.426" height="108.668" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif5" x="280.021" y="122.631" width="92.4563" height="92.6621" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif6" x="1633.78" y="71.1406" width="55.2192" height="55.5801" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif7" x="231.24" y="111.088" width="47.0862" height="47.3945" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif8" x="1635.07" y="182.254" width="34.6631" height="34.9277" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <filter id="hif9" x="247.667" y="205.838" width="29.5579" height="29.7812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10.3"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend mode="normal" in2="shape" result="e1"/></filter>
        <linearGradient id="hip0" x1="462.694" y1="834.621" x2="375.439" y2="508.982" gradientUnits="userSpaceOnUse"><stop stopColor="#DCA854"/><stop offset="1" stopColor="#F6E9D5"/></linearGradient>
        <linearGradient id="hip1" x1="1463.07" y1="909.671" x2="1554.59" y2="446.599" gradientUnits="userSpaceOnUse"><stop stopColor="#54A0DC"/><stop offset="1" stopColor="#D5E7F6"/></linearGradient>
        <linearGradient id="hip2" x1="1531.91" y1="604.058" x2="1494.32" y2="744.343" gradientUnits="userSpaceOnUse"><stop stopColor="#D5E7F6"/><stop offset="1" stopColor="#D5E7F6"/></linearGradient>
        <linearGradient id="hip3" x1="1531.91" y1="604.058" x2="1494.32" y2="744.343" gradientUnits="userSpaceOnUse"><stop stopColor="#D5E7F6"/><stop offset="1" stopColor="#D5E7F6"/></linearGradient>
        <linearGradient id="hip4" x1="964.5" y1="0" x2="964.5" y2="960" gradientUnits="userSpaceOnUse"><stop stopColor="#EAE8F4"/><stop offset="1" stopColor="#F6F5FA"/></linearGradient>
        <linearGradient id="hip5" x1="964.5" y1="163" x2="964.5" y2="780" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip6" x1="1592.15" y1="84.9698" x2="1563.08" y2="193.133" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip7" x1="313.828" y1="122.88" x2="338.612" y2="215.112" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip8" x1="1668.79" y1="71.3959" x2="1654" y2="126.443" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip9" x1="248.47" y1="111.307" x2="261.083" y2="158.246" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip10" x1="1657.15" y1="182.169" x2="1647.81" y2="216.936" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
        <linearGradient id="hip11" x1="258.399" y1="205.764" x2="266.365" y2="235.41" gradientUnits="userSpaceOnUse"><stop stopColor="#4C2CFF"/><stop offset="1" stopColor="#B1A9DA"/></linearGradient>
      </defs>

      {/* Left card */}
      <g className="anim-left">
        <g className="floating">
          <path d="M36.1407 579.543C16.1807 478.518 81.8968 380.44 182.922 360.48L518.687 294.142C619.712 274.182 717.789 339.898 737.749 440.923L804.248 777.499C824.208 878.524 758.492 976.601 657.467 996.561L321.702 1062.9C220.677 1082.86 122.6 1017.14 102.64 916.119L36.1407 579.543Z" fill="#F3EEE7"/>
          <g >
            <path d="M462.569 834.604C415.205 847.296 365.139 845.638 318.719 829.84C272.298 814.043 231.614 784.818 201.824 745.87C201.671 745.671 201.521 745.469 201.376 745.264C195.535 737.034 192.841 726.98 193.784 716.931C193.808 716.681 193.837 716.432 193.869 716.183C200.195 667.559 220.816 621.907 253.118 585.016C285.421 548.125 327.95 521.656 375.314 508.965C422.678 496.274 472.743 497.932 519.164 513.729C565.584 529.526 606.269 558.751 636.059 597.699C636.212 597.898 636.361 598.1 636.506 598.304C642.347 606.535 645.041 616.589 644.098 626.638L644.058 627.012C644.044 627.137 644.03 627.262 644.014 627.386C637.688 676.011 617.067 721.663 584.764 758.554C552.462 795.444 509.933 821.913 462.569 834.604ZM440.885 753.225C485.849 741.177 512.534 694.958 500.485 649.994C488.437 605.029 442.219 578.345 397.254 590.393C352.289 602.441 325.604 648.66 337.652 693.625C349.701 738.589 395.92 765.273 440.885 753.225Z" fill="url(#hip0)"/>
          </g>
        </g>
      </g>

      {/* Right card */}
      <g className="anim-right">
        <g className="floating-delay">
          <path d="M1892.86 579.558C1912.82 478.533 1847.1 380.456 1746.08 360.496L1410.2 294.136C1309.18 274.176 1211.1 339.892 1191.14 440.917L1124.64 777.493C1104.68 878.518 1170.4 976.595 1271.42 996.555L1607.3 1062.92C1708.32 1082.88 1806.4 1017.16 1826.36 916.134L1892.86 579.558Z" fill="#E7EFF3"/>
          <g >
            <path d="M1416.66 898.817C1403.49 898.833 1390.49 895.82 1378.68 890.011C1366.86 884.202 1356.54 875.752 1348.51 865.316C1340.49 854.879 1334.97 842.736 1332.38 829.825C1331.02 823.028 1330.5 816.114 1330.8 809.234C1321.82 803.141 1313.79 795.706 1307.01 787.16C1296.89 774.407 1289.81 759.517 1286.29 743.62C1282.78 727.724 1282.93 711.236 1286.73 695.407C1289.23 685.013 1293.26 675.081 1298.66 665.928C1292.47 655.535 1288.04 644.102 1285.63 632.081C1281 608.922 1284.13 584.879 1294.55 563.683C1304.98 542.487 1322.1 525.321 1343.27 514.848C1343.62 514.674 1343.97 514.503 1344.33 514.333C1346.27 504.54 1349.58 495.043 1354.16 486.125C1360.87 473.084 1370.19 461.556 1381.53 452.255C1392.87 442.954 1405.99 436.077 1420.1 432.048C1434.2 428.019 1448.98 426.923 1463.52 428.829C1478.06 430.735 1492.06 435.602 1504.64 443.129C1517.23 450.656 1528.14 460.685 1536.7 472.594C1540.36 477.689 1543.56 483.082 1546.27 488.708C1550.91 484.535 1555.92 480.762 1561.24 477.444C1573.69 469.687 1587.59 464.563 1602.1 462.39C1616.6 460.217 1631.4 461.041 1645.57 464.81C1659.74 468.58 1672.99 475.215 1684.5 484.306C1696.01 493.397 1705.53 504.751 1712.48 517.666C1719.43 530.581 1723.66 544.785 1724.9 559.398C1725.75 569.39 1725.2 579.43 1723.27 589.225C1723.53 589.518 1723.8 589.812 1724.06 590.108C1739.65 607.847 1748.96 630.237 1750.53 653.804C1752.11 677.37 1745.86 700.798 1732.76 720.453C1725.96 730.655 1717.51 739.545 1707.83 746.802C1709.35 757.321 1709.29 768.037 1707.65 778.598C1705.14 794.684 1699.01 809.988 1689.71 823.353C1680.42 836.718 1668.2 847.793 1653.99 855.737C1644.47 861.061 1634.22 864.883 1623.6 867.104C1621.26 873.582 1618.14 879.775 1614.3 885.544C1607 896.5 1597.27 905.631 1585.88 912.229C1574.48 918.827 1561.72 922.714 1548.58 923.592C1535.45 924.469 1522.28 922.312 1510.11 917.288C1497.94 912.264 1487.09 904.507 1478.4 894.619C1474.73 890.442 1471.48 885.932 1468.7 881.158C1464.31 884.515 1459.6 887.452 1454.61 889.918C1442.81 895.756 1429.82 898.801 1416.66 898.817Z" fill="url(#hip1)"/>
          </g>
          <g >
            <path d="M1491.8 593.311L1521.05 601.147L1496.99 690.926C1494.29 701.015 1489.51 709.219 1482.64 715.538C1475.85 721.812 1467.59 725.901 1457.86 727.805C1448.13 729.708 1437.53 729.126 1426.08 726.058C1414.63 722.99 1405.17 718.199 1397.69 711.685C1390.22 705.17 1385.11 697.499 1382.37 688.671C1379.64 679.781 1379.63 670.291 1382.33 660.203L1406.39 570.424L1435.54 578.235L1412.13 665.6C1410.72 670.861 1410.64 675.88 1411.88 680.657C1413.14 685.373 1415.56 689.47 1419.13 692.95C1422.73 696.368 1427.34 698.831 1432.98 700.341C1438.67 701.866 1443.93 702.048 1448.75 700.886C1453.59 699.662 1457.7 697.314 1461.09 693.842C1464.55 690.326 1466.99 685.937 1468.4 680.676L1491.8 593.311Z" fill="url(#hip2)"/>
            <path d="M1566.45 613.312L1581.67 667.939L1582.78 668.238L1623.36 628.562L1656.41 637.418L1595.61 695.359L1620.37 776.027L1586.57 766.972L1570.99 712.245L1569.87 711.946L1528.83 751.498L1495.4 742.542L1557.18 685.06L1533.21 604.406L1566.45 613.312Z" fill="url(#hip3)"/>
          </g>
        </g>
      </g>

      {/* Center card (always visible) */}
      <g className="floating-center">
        <path d="M485 250C485 111.929 596.929 0 735 0H1194C1332.07 0 1444 111.929 1444 250V710C1444 848.071 1332.07 960 1194 960H735C596.929 960 485 848.071 485 710V250Z" fill="url(#hip4)"/>
        <g >
          <path fillRule="evenodd" clipRule="evenodd" d="M1117.15 263.312L1028.04 311.394L1088.22 312.221C1119.14 312.645 1149.37 321.434 1175.7 337.653L1281 402.519L1221.18 499.563L1134.97 446.453L1164.34 498.97C1179.44 525.955 1186.94 556.522 1186.05 587.426L1182.51 711.019L1068.53 707.752L1071.43 606.557L1040.62 658.248C1024.79 684.809 1002.07 706.588 974.849 721.273L866.008 780L811.848 679.688L900.964 631.604L840.781 630.778C809.857 630.354 779.625 621.566 753.296 605.346L648 540.481L707.82 443.436L794.032 496.546L764.656 444.03C749.562 417.045 742.06 386.478 742.946 355.574L746.492 231.981L860.472 235.248L857.568 336.442L888.376 284.75C904.205 258.191 926.934 236.412 954.15 221.728L1062.99 163L1117.15 263.312ZM924.138 447.453C915.545 461.872 915.299 479.781 923.494 494.43C931.685 509.073 947.078 518.235 963.855 518.465C980.632 518.695 996.271 509.959 1004.86 495.546C1013.45 481.127 1013.7 463.218 1005.51 448.569C997.314 433.925 981.921 424.763 965.144 424.533C948.367 424.303 932.728 433.04 924.138 447.453Z" fill="url(#hip5)"/>
        </g>
      </g>

      {/* Sparks */}
      <g className="spark" style={{ transformOrigin: "1577px 138px" }}>
        <g >
          <path d="M1590.99 84.6771C1592.48 85.0425 1594.06 85.3296 1594.43 87.0585C1595.04 89.888 1594.84 92.8992 1594.91 95.7881C1595.06 102.362 1594.87 108.862 1595.41 115.434C1595.98 122.536 1600.21 129.687 1605.46 134.393C1608.16 136.691 1611.42 138.412 1614.43 140.283C1618.54 142.787 1622.64 145.299 1626.76 147.792C1628.62 148.917 1630.92 150.339 1631.71 152.475C1632.15 153.646 1630.76 155.587 1629.63 155.867C1625.47 156.891 1621.02 156.314 1616.78 156.388C1608.45 156.545 1599.61 155.967 1591.9 159.674C1588.68 161.305 1585.45 163.535 1583.06 166.231C1580.53 169.122 1578.57 172.465 1576.58 175.734C1573.88 180.148 1571.28 184.616 1568.58 189.026C1567.86 190.193 1567.11 191.342 1566.15 192.327C1565.6 192.894 1564.84 193.123 1564.1 193.345C1562.47 193.178 1560.61 192.082 1560.48 190.224C1559.38 174.656 1563.59 155.763 1550.1 144.308C1542.73 138.044 1534.13 134.426 1526.13 129.194C1524.19 127.928 1522.52 126.216 1523.84 123.872C1525.93 121.251 1530.65 122.168 1533.63 121.946C1545.09 121.125 1555.58 123.491 1565.84 117.076C1572.69 112.783 1575.11 108.373 1579.18 101.555C1582.09 96.7065 1585.1 91.7769 1588.02 86.9184C1588.88 85.4768 1589.37 85.0142 1590.99 84.6771Z" fill="url(#hip6)"/>
        </g>
      </g>
      <g className="spark" style={{ transformOrigin: "326px 168px" }}>
        <g >
          <path d="M314.815 122.631C313.546 122.942 312.195 123.187 311.878 124.661C311.36 127.074 311.532 129.642 311.474 132.105C311.347 137.71 311.503 143.253 311.049 148.857C310.558 154.913 306.951 161.011 302.477 165.023C300.173 166.983 297.397 168.451 294.829 170.046C291.321 172.181 287.83 174.323 284.314 176.45C282.728 177.409 280.765 178.621 280.09 180.442C279.721 181.441 280.903 183.096 281.869 183.335C285.413 184.208 289.209 183.716 292.824 183.779C299.923 183.913 307.466 183.42 314.039 186.581C316.78 187.972 319.537 189.873 321.578 192.172C323.738 194.638 325.403 197.488 327.105 200.276C329.403 204.04 331.622 207.85 333.926 211.61C334.536 212.605 335.181 213.585 335.998 214.425C336.468 214.909 337.112 215.103 337.742 215.293C339.13 215.151 340.716 214.216 340.829 212.632C341.771 199.356 338.178 183.246 349.678 173.479C355.967 168.137 363.298 165.052 370.122 160.59C371.773 159.511 373.201 158.051 372.076 156.053C370.294 153.817 366.263 154.599 363.729 154.41C353.957 153.71 345.005 155.728 336.264 150.257C330.416 146.597 328.358 142.837 324.881 137.023C322.407 132.888 319.833 128.685 317.349 124.542C316.612 123.312 316.198 122.918 314.815 122.631Z" fill="url(#hip7)"/>
        </g>
      </g>
      <g className="spark" style={{ transformOrigin: "1660px 98px" }}>
        <g >
          <path d="M1667.84 71.1402C1668.28 71.2589 1669.52 71.6461 1669.61 71.9324C1671.18 76.6676 1669.34 85.8015 1671.05 90.2349C1673.43 96.3758 1678.43 98.9773 1683.84 101.788C1685.55 102.676 1687.52 103.698 1688.77 104.99C1689.08 106.102 1689.07 105.63 1688.8 106.785C1687.14 108.61 1676.29 107.551 1672.99 108.048C1662.69 109.598 1660.54 119.179 1655.03 126.72C1654.06 126.446 1653.76 126.403 1652.93 125.805C1651.86 123.653 1652.96 114.866 1652.39 111.435C1650.52 100.23 1642.92 99.453 1634.98 93.8573C1634.16 93.2839 1633.9 92.8388 1633.78 91.8714C1634.89 88.6405 1644.39 90.5875 1647.65 90.2343C1649.99 89.9802 1651.07 89.3357 1652.91 88.9732C1660.81 87.4213 1663.85 73.707 1667.84 71.1402Z" fill="url(#hip8)"/>
        </g>
      </g>
      <g className="spark" style={{ transformOrigin: "254px 134px" }}>
        <g >
          <path d="M249.281 111.089C248.909 111.19 247.853 111.52 247.772 111.764C246.438 115.802 248.008 123.59 246.545 127.371C244.518 132.607 240.251 134.826 235.639 137.222C234.181 137.98 232.504 138.851 231.438 139.953C231.17 140.901 231.184 140.499 231.414 141.483C232.824 143.04 242.081 142.136 244.896 142.56C253.679 143.882 255.507 152.052 260.204 158.482C261.034 158.249 261.291 158.212 261.997 157.701C262.911 155.867 261.969 148.374 262.459 145.449C264.056 135.893 270.535 135.231 277.307 130.46C278.001 129.971 278.226 129.591 278.326 128.766C277.381 126.011 269.283 127.671 266.502 127.37C264.502 127.154 263.582 126.604 262.01 126.295C255.278 124.972 252.684 113.277 249.281 111.089Z" fill="url(#hip9)"/>
        </g>
      </g>
      <g className="spark" style={{ transformOrigin: "1652px 199px" }}>
        <g >
          <path d="M1657.47 182.255C1659.1 183.973 1657.47 191.847 1659.06 195.442C1660.62 198.97 1670.26 202.72 1669.71 204.775C1668.01 205.518 1665.32 205.169 1663.5 205.197C1652.51 205.366 1654.02 211.939 1648.72 217.181C1647.05 216.318 1647.54 209.673 1647.44 207.759C1647.06 200.852 1639.82 199.027 1635.07 194.965C1638.78 194.303 1642.14 194.721 1645.66 194.171C1652.71 193.07 1652.82 186.35 1657.47 182.255Z" fill="url(#hip10)"/>
        </g>
      </g>
      <g className="spark" style={{ transformOrigin: "261px 219px" }}>
        <g >
          <path d="M258.128 205.837C256.74 207.302 258.126 214.017 256.768 217.082C255.436 220.091 247.221 223.288 247.686 225.04C249.138 225.674 251.434 225.376 252.987 225.4C262.354 225.544 261.065 231.149 265.588 235.619C267.011 234.883 266.593 229.218 266.681 227.585C266.999 221.696 273.179 220.14 277.224 216.675C274.065 216.111 271.202 216.468 268.194 215.998C262.181 215.06 262.092 209.33 258.128 205.837Z" fill="url(#hip11)"/>
        </g>
      </g>
    </svg>
  );
}
