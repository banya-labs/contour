export const clerkEditorialAppearance = {
  variables: {
    colorPrimary: "#282828",
    colorText: "#282828",
    colorTextSecondary: "#6b6b6b",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#282828",
    borderRadius: "0px",
    fontFamily: '"BT Grotesk", Arial, sans-serif',
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "rounded-none border border-[#e0e0e0] shadow-none bg-white p-6 sm:p-8 w-full",
    cardBox: "rounded-none shadow-none border border-[#e0e0e0] bg-white",
    headerTitle: "font-heading font-bold text-2xl tracking-tight text-[#282828] uppercase",
    headerSubtitle: "font-geist text-xs text-[#6b6b6b] mt-1",
    socialButtonsBlockButton:
      "rounded-none border border-[#e0e0e0] hover:border-[#282828] hover:bg-neutral-50 font-geist text-xs text-[#282828] transition-colors shadow-none py-2.5",
    socialButtonsBlockButtonText: "font-geist text-xs font-medium text-[#282828]",
    dividerLine: "bg-[#e0e0e0] h-px",
    dividerText: "font-geist text-[11px] uppercase tracking-wider text-[#6b6b6b]",
    formFieldLabel: "font-geist text-xs font-semibold text-[#282828] tracking-wide mb-1",
    formFieldInput:
      "rounded-none border border-[#e0e0e0] focus:border-[#fa3600] focus:ring-1 focus:ring-[#fa3600] text-[#282828] font-geist text-sm py-2.5 px-3 shadow-none transition-colors",
    formButtonPrimary:
      "rounded-none bg-[#282828] hover:bg-[#fa3600] text-white font-heading font-bold text-sm tracking-wide py-3.5 transition-colors shadow-none mt-2",
    formButtonReset:
      "rounded-none border border-[#e0e0e0] hover:bg-neutral-50 text-[#282828] font-geist text-xs py-2.5 px-4 transition-colors shadow-none",
    footerActionText: "font-geist text-xs text-[#6b6b6b]",
    footerActionLink: "font-geist text-xs font-semibold text-[#fa3600] hover:underline underline-offset-2",
    identityPreviewText: "font-geist text-sm text-[#282828]",
    identityPreviewEditButton: "font-geist text-xs text-[#fa3600] hover:underline",
    formFieldSuccessText: "font-geist text-xs text-emerald-600",
    formFieldErrorText: "font-geist text-xs text-[#fa3600] font-medium",
    badge: "rounded-none bg-neutral-100 text-[#282828] font-geist text-[10px] font-bold border border-[#e0e0e0] px-2 py-0.5 uppercase tracking-wider",
    alert: "rounded-none border border-[#fa3600] bg-[#fff5f3] text-[#282828] font-geist text-xs p-3",
    alertText: "text-xs font-geist text-[#282828]",

    // Organization Switcher & B2B Elements
    organizationSwitcherTrigger:
      "rounded-none border border-[#e0e0e0] bg-white hover:bg-neutral-50 px-3 py-2 text-xs font-heading font-semibold text-[#282828] transition-colors shadow-none w-full flex items-center justify-between",
    organizationSwitcherTriggerIcon: "text-[#6b6b6b]",
    organizationSwitcherPopoverCard:
      "rounded-none border border-[#e0e0e0] shadow-none bg-white p-2 min-w-[240px]",
    organizationSwitcherPopoverActions: "border-t border-[#e0e0e0] pt-2 mt-2",
    organizationSwitcherPopoverActionButton:
      "rounded-none hover:bg-neutral-50 text-xs font-geist text-[#282828] p-2 transition-colors w-full text-left flex items-center gap-2",

    // User Button & Popover
    userButtonTrigger: "rounded-none focus:outline-none focus:ring-1 focus:ring-[#fa3600]",
    userButtonAvatarBox: "rounded-none border border-[#e0e0e0] w-8 h-8",
    userButtonAvatarImage: "rounded-none object-cover",
    userButtonPopoverCard:
      "rounded-none border border-[#e0e0e0] shadow-none bg-white p-3 min-w-[260px]",
    userButtonPopoverActionButton:
      "rounded-none hover:bg-[#fff5f3] hover:text-[#fa3600] text-xs font-geist text-[#282828] p-2 transition-colors",
    userButtonPopoverActionButtonIcon: "text-[#6b6b6b]",
    userButtonPopoverFooter: "border-t border-[#e0e0e0] pt-2 mt-2",

    // Organization Profile & User Profile Internal Shells
    navbar: "border-b border-[#e0e0e0] bg-white gap-2 p-1",
    navbarButton:
      "rounded-none font-heading text-xs font-semibold uppercase tracking-wider text-[#6b6b6b] hover:text-[#282828] hover:bg-neutral-50 px-3 py-2 transition-colors data-[active=true]:text-[#fa3600] data-[active=true]:border-b-2 data-[active=true]:border-[#fa3600]",
    navbarMobileMenuRow: "rounded-none border-b border-[#e0e0e0]",
    pageScrollBox: "p-4 sm:p-6 bg-white",
    profileSection: "border-b border-[#e0e0e0] pb-6 mb-6",
    profileSectionHeader: "mb-4",
    profileSectionTitleText: "font-heading font-bold text-base text-[#282828] uppercase tracking-tight",
    profileSectionSubtitleText: "font-geist text-xs text-[#6b6b6b]",
    profileSectionContent: "space-y-4",
    accordionTriggerButton: "rounded-none hover:bg-neutral-50 font-geist text-xs text-[#282828] p-3",
    accordionContent: "p-4 border-t border-[#e0e0e0] bg-neutral-50/50",
    menuButton: "rounded-none hover:bg-neutral-50 text-xs font-geist text-[#282828] p-2",
    menuList: "rounded-none border border-[#e0e0e0] bg-white shadow-none p-1",
    table: "rounded-none border border-[#e0e0e0] text-xs font-geist",
    tableHead: "bg-neutral-50 border-b border-[#e0e0e0] font-heading font-semibold text-[#6b6b6b] uppercase text-[11px]",
    tableRow: "border-b border-[#e0e0e0] hover:bg-[#fff5f3]/60 transition-colors",
    tableCell: "py-3 px-4 text-xs font-geist text-[#282828]",
    avatarImageActionsUploadButton:
      "rounded-none border border-[#e0e0e0] hover:bg-neutral-50 text-xs font-geist text-[#282828] px-3 py-1.5 transition-colors shadow-none",
    avatarImageActionsRemoveButton:
      "rounded-none text-xs font-geist text-[#fa3600] hover:underline px-3 py-1.5",
  },
};
