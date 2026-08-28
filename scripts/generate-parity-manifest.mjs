import { execFileSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import {
  CANONICAL_ROOT,
  discoverCanonicalInventory,
  EXCLUDED_DIRECTORIES,
} from "./parity-canonical-inventory.mjs";
import {
  CANONICAL_COMMIT,
  collectPinnedExcludedContractInputClosure,
  contractInputsForModule,
} from "./parity-contract-inputs.mjs";
import {
  collectParityManifestExports,
  collectParityManifestFileExports,
} from "./parity-manifest-exports.mjs";

const canonicalBehaviorDependencies = {
  avatar: [
    "package.json",
    "static/app/components/core/avatar/actorAvatar.spec.tsx",
    "static/app/components/core/avatar/avatar.mdx",
    "static/app/components/core/avatar/avatar.spec.tsx",
    "static/app/components/core/avatar/avatarComponentStyles.tsx",
    "static/app/components/core/avatar/avatarList.spec.tsx",
    "static/app/components/core/avatar/imageAvatar/imageAvatar.spec.tsx",
    "static/app/components/core/avatar/letterAvatar/letterAvatar.spec.tsx",
    "static/app/components/core/avatar/sentryAppAvatar.spec.tsx",
    "static/app/components/core/avatar/teamAvatar.spec.tsx",
    "static/app/components/core/avatar/useAvatar.spec.tsx",
    "static/app/components/core/avatar/userAvatar.spec.tsx",
    "static/app/components/core/badge/index.tsx",
    "static/app/components/core/badge/tag.tsx",
    "static/app/components/core/image/image.tsx",
    "static/app/components/core/tooltip/index.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/placeholder.tsx",
    "static/app/components/platformList.tsx",
    "static/app/icons/iconGeneric.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/stores/configStore.tsx",
    "static/app/types/core.tsx",
    "static/app/types/integrations.tsx",
    "static/app/types/organization.tsx",
    "static/app/types/platform.tsx",
    "static/app/types/project.tsx",
    "static/app/types/system.tsx",
    "static/app/types/user.tsx",
    "static/app/utils.tsx",
    "static/app/utils/formatters.tsx",
    "static/app/utils/members/useMembers.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/swatch.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/useTeamsById.tsx",
    "static/less/shared-components.less",
  ],
  drawer: [
    "static/app/components/core/backdrop/backdrop.tsx",
    "static/app/components/core/drawer/index.spec.tsx",
    "static/app/components/core/drawer/useDrawerResizing.tsx",
    "static/app/components/core/hotkey/useHotkeys.tsx",
    "static/app/components/core/slideOverPanel/slideOverPanel.tsx",
    "static/app/components/core/useScrollLock.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/utils/createStorage.tsx",
    "static/app/utils/localStorage.tsx",
    "static/app/utils/useSyncedLocalStorageState.tsx",
  ],
  modal: [
    "static/app/components/core/backdrop/backdrop.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/modal/index.spec.tsx",
    "static/app/components/core/modal/modal.mdx",
    "static/app/components/core/useScrollLock.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/stores/modalStore.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  alert: [
    "static/app/components/core/alert/alert.figma.tsx",
    "static/app/components/core/alert/alert.mdx",
    "static/app/components/core/alert/alert.spec.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/icons/iconCheckmark.tsx",
    "static/app/icons/iconChevron.tsx",
    "static/app/icons/iconInfo.tsx",
    "static/app/icons/iconNot.tsx",
    "static/app/icons/iconWarning.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  badge: [
    "package.json",
    "static/app/components/core/badge/alertBadge.spec.tsx",
    "static/app/components/core/badge/badge.mdx",
    "static/app/components/core/badge/badge.snapshots.tsx",
    "static/app/components/core/badge/deployBadge.spec.tsx",
    "static/app/components/core/badge/featureBadge.figma.tsx",
    "static/app/components/core/badge/featureBadge.spec.tsx",
    "static/app/components/core/badge/tag.figma.tsx",
    "static/app/components/core/badge/tag.mdx",
    "static/app/components/core/badge/tag.spec.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/core/useIsInsideInteractiveElement.ts",
    "static/app/components/searchSyntax/mutableSearch.tsx",
    "static/app/icons/iconAllProjects.tsx",
    "static/app/icons/iconBroadcast.tsx",
    "static/app/icons/iconBug.tsx",
    "static/app/icons/iconCheckmark.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/icons/iconFire.tsx",
    "static/app/icons/iconIssues.tsx",
    "static/app/icons/iconLab.tsx",
    "static/app/icons/iconMyProjects.tsx",
    "static/app/icons/iconPause.tsx",
    "static/app/icons/iconWarning.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/types/release.tsx",
    "static/app/utils/useStableMergeRef.ts",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/views/alerts/types.tsx",
  ],
  select: [
    "package.json",
    "static/app/components/core/select/select.mdx",
    "static/app/components/forms/controls/reactSelectWrapper.tsx",
    "static/app/icons/iconAdd.tsx",
    "static/app/icons/iconCheckmark.tsx",
    "static/app/icons/iconChevron.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/types/core.tsx",
    "static/app/utils/convertFromSelect2Choices.tsx",
    "static/app/utils/defined.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  tabs: [
    "static/app/components/core/compactSelect/index.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/overlayTrigger/index.tsx",
    "static/app/components/core/tabs/tab.tsx",
    "static/app/components/core/tabs/tabList.snapshots.tsx",
    "static/app/components/core/tabs/tabs.mdx",
    "static/app/components/core/tabs/tabs.spec.tsx",
    "static/app/components/core/tabs/utils.tsx",
    "static/app/components/core/tooltip/index.tsx",
    "static/app/icons/iconEllipsis.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  avatarButton: [
    "package.json",
    "static/app/components/core/avatar/avatar.tsx",
    "static/app/components/core/avatar/avatarComponentStyles.tsx",
    "static/app/components/core/avatar/imageAvatar/imageAvatar.tsx",
    "static/app/components/core/avatar/letterAvatar/letterAvatar.tsx",
    "static/app/components/core/avatar/useAvatar.spec.tsx",
    "static/app/components/core/avatar/useAvatar.ts",
    "static/app/components/core/avatarButton/avatarButton.mdx",
    "static/app/components/core/avatarButton/avatarButton.spec.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/button/useButtonFunctionality.tsx",
    "static/app/components/core/image/image.tsx",
    "static/app/components/core/sizeContext.tsx",
    "static/app/utils/queryClient.tsx",
    "static/app/utils/theme/swatch.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  button: [
    "package.json",
    "static/app/components/core/button/button.figma.tsx",
    "static/app/components/core/button/button.mdx",
    "static/app/components/core/button/button.snapshots.tsx",
    "static/app/components/core/button/button.spec.tsx",
    "static/app/components/core/button/buttonBar.mdx",
    "static/app/components/core/button/linkButton.mdx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/button/useButtonFunctionality.tsx",
    "static/app/components/core/layout/grid.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/link/link.tsx",
    "static/app/components/core/loader/indeterminateLoader.tsx",
    "static/app/components/core/sizeContext.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/core/trackingContext.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  chat: [
    "static/app/components/copyToClipboardButton.tsx",
    "static/app/components/core/chat/assistantActions.mdx",
    "static/app/components/core/chat/assistantMessage.mdx",
    "static/app/components/core/chat/messageRow.mdx",
    "static/app/components/core/chat/thinkingBlock.mdx",
    "static/app/components/core/chat/thinkingBlock.spec.tsx",
    "static/app/components/core/chat/toolCallIndicator.mdx",
    "static/app/components/core/chat/userMessage.mdx",
    "static/app/components/core/markdown/useStreamingAnimation.ts",
    "static/app/icons/iconCheckmark.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/icons/iconCopy.tsx",
    "static/app/icons/iconSeer.tsx",
    "static/app/icons/iconThumb.tsx",
    "static/app/icons/iconWarning.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/duration/getDuration.tsx",
    "static/app/utils/formatters.tsx",
    "static/app/utils/useCopyToClipboard.tsx",
  ],
  markdown: [
    "package.json",
    "static/app/components/core/checkbox/checkbox.tsx",
    "static/app/components/core/code/codeBlock.tsx",
    "static/app/components/core/code/inlineCode.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/link/index.tsx",
    "static/app/components/core/markdown/defaultComponents.tsx",
    "static/app/components/core/markdown/markdown.mdx",
    "static/app/components/core/markdown/markdown.spec.tsx",
    "static/app/components/core/markdown/token.tsx",
    "static/app/components/core/quote/quote.tsx",
    "static/app/components/core/separator/separator.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/utils/marked/extensions/index.ts",
    "static/app/utils/marked/extensions/tag.spec.ts",
    "static/app/utils/marked/extensions/tag.ts",
    "static/app/utils/marked/marked.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
  ],
  backdrop: ["static/app/utils/theme/theme.tsx"],
  chip: [
    "static/app/components/core/chip/chip.snapshots.tsx",
    "static/app/components/core/chip/chip.spec.tsx",
    "static/app/icons/iconClose.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
  ],
  compactSelect: [
    "static/app/components/core/compactSelect/compactSelect.mdx",
    "static/app/components/core/compactSelect/compactSelect.spec.tsx",
    "static/app/components/core/compactSelect/composite.mdx",
    "static/app/components/core/compactSelect/composite.spec.tsx",
    "static/app/components/core/compactSelect/gridList/index.tsx",
    "static/app/components/core/compactSelect/gridList/option.tsx",
    "static/app/components/core/compactSelect/gridList/section.tsx",
    "static/app/components/core/compactSelect/highlightText.spec.tsx",
    "static/app/components/core/compactSelect/listBox/index.spec.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/checkbox/checkbox.tsx",
    "static/app/components/core/input/inputGroup.tsx",
    "static/app/components/core/menuListItem/index.tsx",
    "static/app/utils/search/fzf.spec.tsx",
    "static/app/utils/search/fzf.tsx",
    "static/app/utils/useOverlay.tsx",
  ],
  info: [
    "static/app/components/core/info/infoText.spec.tsx",
    "static/app/icons/iconLock.tsx",
    "static/app/icons/iconQuestion.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  disclosure: [
    "package.json",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/disclosure/disclosure.mdx",
    "static/app/components/core/disclosure/disclosure.spec.tsx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/icons/iconChevron.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  pagination: [
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/grid.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/pagination/pagination.mdx",
    "static/app/components/core/pagination/pagination.spec.tsx",
    "static/app/icons/iconChevron.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/locale.tsx",
    "static/app/utils/cursor.tsx",
    "static/app/utils/defined.tsx",
    "static/app/utils/parseLinkHeader.tsx",
    "static/app/utils/useLocation.tsx",
    "static/app/utils/useNavigate.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  toast: [
    "static/app/actionCreators/indicator.tsx",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/toast/toast.mdx",
    "static/app/components/indicators.spec.tsx",
    "static/app/components/indicators.tsx",
    "static/app/components/loadingIndicator.tsx",
    "static/app/components/textOverflow.tsx",
    "static/app/icons/iconCheckmark.tsx",
    "static/app/icons/iconRefresh.tsx",
    "static/app/icons/iconWarning.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/locale.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/less/shared-components.less",
  ],
  code: [
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/button/useButtonFunctionality.tsx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/overlay.tsx",
    "static/app/components/overlayArrow.tsx",
    "static/app/icons/iconCopy.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/locale.tsx",
    "static/app/styles/global.tsx",
    "static/app/utils/prism.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/useHoverOverlay.tsx",
  ],
  textarea: [
    "package.json",
    "static/app/components/core/input/inputStyles.tsx",
    "static/app/components/core/textarea/textarea.figma.tsx",
    "static/app/components/core/textarea/textarea.spec.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  input: [
    "package.json",
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/input/input.mdx",
    "static/app/components/core/input/input.spec.tsx",
    "static/app/components/core/input/inputGroup.mdx",
    "static/app/components/core/input/inputGroup.snapshots.tsx",
    "static/app/components/core/input/inputGroup.spec.tsx",
    "static/app/components/core/input/inputStyles.tsx",
    "static/app/components/core/input/numberDragInput.mdx",
    "static/app/components/core/input/numberInput.mdx",
    "static/app/components/core/input/numberInput.spec.tsx",
    "static/app/components/core/textarea/textarea.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/icons/iconArrow.tsx",
    "static/app/icons/iconChevron.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/locale.tsx",
    "static/app/utils/profiling/colors/clamp.ts",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  segmentedControl: [
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/segmentedControl/segmentedControl.mdx",
    "static/app/components/core/segmentedControl/segmentedControl.spec.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
  slider: [
    "static/app/components/core/slider/slider.figma.tsx",
    "static/app/components/core/slider/slider.mdx",
    "static/app/components/core/slider/slider.spec.tsx",
  ],
  switch: [
    "static/app/components/core/switch/switch.figma.tsx",
    "static/app/components/core/switch/switch.mdx",
    "static/app/components/core/switch/switch.snapshots.tsx",
    "static/app/components/core/switch/switch.spec.tsx",
  ],
  emptyState: [
    "static/app/components/core/emptyState/emptyState.mdx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/heading.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
  ],
  loader: [
    "package.json",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/loader/loader.mdx",
    "static/app/components/core/principles/motion/motion.mdx",
    "static/app/components/core/separator/index.tsx",
    "static/app/components/core/separator/separator.tsx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
    "static/less/fonts.less",
  ],
  quote: [
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/flex.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/stack.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/quote/quote.mdx",
    "static/app/components/core/text/index.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/components/core/text/text.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
  ],
  text: [
    "static/less/fonts.less",
    "static/app/components/core/hotkey/kbd.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/code/inlineCode.tsx",
    "static/app/components/core/text/styles.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/types.tsx",
  ],
  image: [
    "static/app/components/core/layout/styles.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/types.tsx",
  ],
  hotkey: [
    "static/app/components/core/hotkey/keyMappings.tsx",
    "static/app/icons/iconArrow.tsx",
    "static/app/icons/iconCommand.tsx",
    "static/app/icons/iconControl.tsx",
    "static/app/icons/iconOption.tsx",
    "static/app/icons/iconReturn.tsx",
    "static/app/icons/iconShift.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/utils/array/toArray.tsx",
    "static/app/utils/string/toTitleCase.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
  ],
  pictureInPicture: [
    "static/app/components/core/pictureInPicture/pictureInPicture.spec.tsx",
    "static/app/types/documentPictureInPicture.d.ts",
  ],
  revealOnHover: ["static/app/utils/theme/theme.tsx"],
  slot: [
    "static/app/components/core/sizeContext.tsx",
    "static/app/components/core/slot/knownContexts.ts",
  ],
  splitPanel: ["static/app/utils/useDimensions.tsx", "static/app/utils/useResizableDrawer.tsx"],
  table: [
    "static/app/components/tables/sortableHeaderCell.tsx",
    "static/app/components/tables/useColumnResize.tsx",
    "static/app/components/tables/useObservedColumnSize.tsx",
    "static/app/icons/iconArrow.tsx",
  ],
  statusIndicator: [
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
  ],
  slideOverPanel: [
    "static/app/components/core/boundaryContext.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/types.tsx",
    "static/app/views/navigation/constants.tsx",
    "static/app/views/navigation/useTopOffset.tsx",
  ],
  tooltip: [
    "package.json",
    "static/app/components/core/tooltip/tooltip.figma.tsx",
    "static/app/components/core/tooltip/tooltip.mdx",
    "static/app/components/core/tooltip/tooltip.spec.tsx",
    "static/app/components/overlay.tsx",
    "static/app/components/overlayArrow.tsx",
    "static/app/utils/theme/index.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/theme/types.tsx",
    "static/app/utils/useHoverOverlay.spec.tsx",
    "static/app/utils/useHoverOverlay.timing.spec.tsx",
    "static/app/utils/useHoverOverlay.tsx",
    "static/app/utils/useStableMergeRef.ts",
  ],
  link: [
    "package.json",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/link/link.spec.tsx",
    "static/app/components/core/link/link.mdx",
    "static/app/components/core/trackingContext.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/theme.tsx",
  ],
};
const sentryRepository = path.resolve(process.env.SENTRY_REPO_PATH ?? "../sentry");
const sentryDependencyRepository = path.resolve(
  process.env.SENTRY_DEPENDENCY_REPO_PATH ?? "../sentry",
);
const canonicalRoot = CANONICAL_ROOT;

const localModules = {
  drawer: ["src/components/ui/drawer.tsx"],
  modal: ["src/components/ui/modal.tsx"],
  alert: ["src/components/ui/alert.tsx"],
  avatar: ["src/components/ui/avatar-actor-resolver.tsx", "src/components/ui/avatar.tsx"],
  avatarButton: ["src/components/ui/avatar-button.tsx"],
  backdrop: ["src/components/ui/backdrop.tsx"],
  badge: ["src/components/ui/badge.tsx"],
  button: ["src/components/ui/button.tsx"],
  breadcrumbList: ["src/components/ui/breadcrumb-list.tsx"],
  compactSelect: [
    "src/components/ui/compact-select-support.tsx",
    "src/components/ui/compact-select.tsx",
  ],
  chat: ["src/components/ui/chat.tsx"],
  markdown: [
    "src/components/ui/markdown-default-components.tsx",
    "src/components/ui/markdown-token.tsx",
    "src/components/ui/markdown.tsx",
  ],
  checkbox: ["src/components/ui/checkbox.tsx"],
  chip: ["src/components/ui/chip.tsx"],
  info: ["src/components/ui/info.tsx"],
  disclosure: ["src/components/ui/disclosure.tsx"],
  pagination: ["src/components/ui/pagination.tsx"],
  toast: ["src/components/ui/toast.tsx"],
  code: [
    "src/components/ui/code-block.tsx",
    "src/components/ui/code-messages.tsx",
    "src/components/ui/code.tsx",
  ],
  emptyState: ["src/components/ui/empty-state.tsx"],
  form: [
    "src/components/ui/form-auto-save-context.tsx",
    "src/components/ui/form-context.ts",
    "src/components/ui/form-fields.tsx",
    "src/components/ui/form.tsx",
  ],
  loader: ["src/components/ui/loader.tsx"],
  slideOverPanel: ["src/components/ui/slide-over-panel.tsx"],
  quote: ["src/components/ui/quote.tsx"],
  text: [
    "src/components/ui/text.tsx",
    "src/components/ui/heading.tsx",
    "src/components/ui/prose.tsx",
  ],
  dragHandle: [
    "src/components/ui/drag-handle.tsx",
    "src/components/ui/use-drag-move.tsx",
    "src/components/ui/use-drag-separator.tsx",
  ],
  input: ["src/components/ui/input.tsx", "src/components/ui/input-group.tsx"],
  interactionStateLayer: ["src/components/ui/interaction-state-layer.tsx"],
  hotkey: ["src/components/ui/hotkey.tsx"],
  image: ["src/components/ui/image.tsx"],
  layout: ["src/components/ui/layout.tsx"],
  link: [
    "src/components/ui/link-behavior-context.tsx",
    "src/components/ui/link.tsx",
    "src/components/ui/tracking-context.tsx",
  ],
  radio: ["src/components/ui/radio.tsx"],
  menuListItem: ["src/components/ui/menu-list-item.tsx"],
  pictureInPicture: [
    "src/components/ui/picture-in-picture-portal.tsx",
    "src/components/ui/picture-in-picture.tsx",
  ],
  revealOnHover: ["src/components/ui/reveal-on-hover.tsx"],
  segmentedControl: ["src/components/ui/segmented-control.tsx"],
  select: [
    "src/components/ui/body-scroll-lock.ts",
    "src/components/ui/select-types.ts",
    "src/components/ui/select.tsx",
  ],
  separator: ["src/components/ui/separator.tsx"],
  slot: ["src/components/ui/slot.tsx"],
  splitPanel: ["src/components/ui/split-panel.tsx"],
  slider: ["src/components/ui/slider.tsx"],
  statusIndicator: ["src/components/ui/status-indicator.tsx"],
  switch: ["src/components/ui/switch.tsx"],
  table: ["src/components/ui/table.tsx"],
  tabs: ["src/components/ui/tabs.tsx"],
  textarea: ["src/components/ui/textarea.tsx"],
  tooltip: ["src/components/ui/tooltip.tsx"],
};

const registryItems = {
  drawer: ["drawer"],
  modal: ["modal"],
  alert: ["alert"],
  avatar: ["avatar"],
  avatarButton: ["avatar-button"],
  backdrop: ["backdrop"],
  badge: ["badge"],
  button: ["button"],
  breadcrumbList: ["breadcrumb-list"],
  compactSelect: ["compact-select"],
  chat: ["chat"],
  markdown: ["markdown"],
  checkbox: ["checkbox"],
  chip: ["chip"],
  info: ["info"],
  disclosure: ["disclosure"],
  pagination: ["pagination"],
  toast: ["toast"],
  menuListItem: ["menu-list-item"],
  pictureInPicture: ["picture-in-picture"],
  code: ["code"],
  emptyState: ["empty-state"],
  form: ["form"],
  loader: ["loader"],
  slideOverPanel: ["slide-over-panel"],
  quote: ["quote"],
  text: ["text"],
  dragHandle: ["drag-handle"],
  interactionStateLayer: ["interaction-state-layer"],
  hotkey: ["hotkey"],
  image: ["image"],
  layout: ["layout"],
  separator: ["separator"],
  slot: ["slot"],
  splitPanel: ["split-panel"],
  table: ["table"],
  link: ["link"],
  radio: ["radio"],
  revealOnHover: ["reveal-on-hover"],
  segmentedControl: ["segmented-control"],
  select: ["select"],
  slider: ["slider"],
  switch: ["switch"],
  tabs: ["tabs"],
  statusIndicator: ["status-indicator"],
  tooltip: ["tooltip"],
  textarea: ["textarea"],
  input: ["input"],
};

const codeConnectFiles = {
  alert: ["src/components/ui/alert.figma.ts"],
  badge: ["src/components/ui/feature-badge.figma.ts", "src/components/ui/tag.figma.ts"],
  button: ["src/components/ui/button.figma.ts"],
  checkbox: ["src/components/ui/checkbox.figma.ts"],
  emptyState: ["src/components/ui/empty-state.figma.ts"],
  radio: ["src/components/ui/radio.figma.ts"],
  slider: ["src/components/ui/slider.figma.ts"],
  switch: ["src/components/ui/switch.figma.ts"],
  tooltip: ["src/components/ui/tooltip.figma.ts"],
  textarea: ["src/components/ui/textarea.figma.ts"],
};

const standaloneApiCoverage = {
  "boundaryContext.tsx": {
    localPaths: ["src/components/ui/boundary-context.tsx"],
    state: "complete",
    note: "The provider and hook preserve the standalone public contract.",
    behaviorTest: "provides date-time, boundary, size, and translation values",
    testSymbols: ["useBoundaryContext"],
  },
  "datetime.tsx": {
    localPaths: ["src/components/ui/datetime.tsx"],
    state: "complete",
    note: "The provider and timezone and clock hooks preserve the standalone public contract.",
    behaviorTest: "provides date-time, boundary, size, and translation values",
    testSymbols: ["DateTimeProvider"],
  },
  "overlayTrigger.tsx": {
    localPaths: ["src/components/ui/overlay-trigger.tsx"],
    state: "complete",
    note: "The Button and IconButton triggers preserve the public contract through the local Button and CompactSelect context.",
    behaviorTest: "applies CompactSelect context to both overlay trigger forms",
    testSymbols: ["OverlayTrigger"],
  },
  "renderToString.tsx": {
    excludedExports: { runtime: ["useRenderToString"], types: [] },
    localPaths: [],
    state: "excluded",
    note: "This Emotion-coupled pattern helper is outside the component-family migration.",
    behaviorTest: null,
    testSymbols: [],
  },
  "sizeContext.tsx": {
    localPaths: ["src/components/ui/size-context.tsx"],
    state: "complete",
    note: "The provider, context, and hook preserve the standalone public contract.",
    behaviorTest: "provides date-time, boundary, size, and translation values",
    testSymbols: ["SizeProvider"],
  },
  "trackingContext.tsx": {
    localPaths: ["src/components/ui/tracking-context.tsx"],
    state: "complete",
    note: "The provider, analytics types, and click-tracking hook preserve the standalone public contract.",
    behaviorTest: "tracks clicks through TrackingContextProvider",
    testSymbols: ["useClickTracking"],
  },
  "translationContext.tsx": {
    localPaths: ["src/components/ui/translation-context.tsx", "src/lib/scraps-locale.ts"],
    state: "complete",
    note: "The provider and hook preserve the standalone context contract alongside the application-wide locale adapter.",
    behaviorTest: "connects translated components to TranslationContextProvider",
    testSymbols: ["TranslationContextProvider"],
  },
  "useIsInsideInteractiveElement.ts": {
    localPaths: ["src/components/ui/use-is-inside-interactive-element.ts"],
    state: "complete",
    note: "The standalone hook preserves interactive-ancestor and focus-visible behavior and is used by Badge.",
    behaviorTest: "detects an interactive ancestor",
    testSymbols: ["useIsInsideInteractiveElement"],
  },
  "useScrollLock.tsx": {
    localPaths: ["src/components/ui/use-scroll-lock.tsx"],
    state: "complete",
    note: "The standalone hook preserves shared container locks, body scroll restoration, and acquire, release, and held methods.",
    behaviorTest: "supports idempotent acquisition, independent containers, and reacquisition",
    testSymbols: ["useScrollLock"],
  },
};

for (const coverage of Object.values(standaloneApiCoverage)) {
  coverage.testPaths =
    coverage.state === "complete"
      ? ["src/components/ui/standalone-core.test.tsx", "tests/types/standalone-core-types.test.tsx"]
      : [];
}

const completionEvidence = {
  drawer:
    "Regular Scraps Drawer is a Tailwind-only provider-scoped controller with blocking and passive modes, shared scroll locking, resizing, header and body composition, workbench, focused tests, and standalone registry delivery. The canonical module has no Code Connect mapping or Figma node.",
  modal:
    "Exact regular Scraps GlobalModal singleton render-prop contract, close modes and reasons, focus trap, focus restore, scroll lock, root hiding, responsive motion, nested CompactSelect Escape behavior, workbench, focused tests, and standalone registry delivery use literal Tailwind classes. The returned CloseButton inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The separate ModalOptions.modalCss Emotion interpolation input is owner-authorized and recorded in scope.excludedContractInputs; local modalCss accepts Tailwind classes only. The canonical module has no Code Connect mapping or Figma node.",
  breadcrumbList:
    "Exact regular Scraps BreadcrumbList parent and title contracts, 512px container-query collapse, project selection, pagination, actions, editable title behavior, workbench, focused tests, local registry item, and canonical MDX Figma resource are present. Breadcrumb button actions inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no Code Connect mapping or property vocabulary to copy.",
  compactSelect:
    "Exact regular Scraps CompactSelect and CompositeSelect public exports, controlled single and multiple selection, clear behavior, sections, search, highlighting, custom triggers, list and grid modes, focus, keyboard behavior, disabled options, select-all sections, virtualization, positioning options, menu composition, workbench, focused tests, and standalone registry delivery use literal Tailwind classes. Select option tooltipOptions inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no Code Connect file or approved component property vocabulary to copy.",
  alert:
    "Exact regular Scraps Alert and AlertLink consumer contracts, theme tokens, Sentry glyphs, expansion behavior, responsive trailing layout, workbench, focused tests, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. Alert.Button inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The mapping preserves the live variant, system, showIcon, expand, information, trailingItems, and trailingSlot Figma vocabulary under the Scrapscn React label.",
  avatar:
    "Exact regular Scraps Avatar module exports, discriminated base contract, image and letter resolution, deterministic theme swatches, upload and Gravatar fallback, derived user, team, organization, project and integration avatars, provider-backed actor record resolution, collapsed avatar lists, literal Tailwind styling, workbench, focused tests, production browser behavior, and standalone registry delivery are present. AvatarProps.tooltipOptions inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical Avatar MDX has no Figma component or Code Connect property vocabulary.",
  avatarButton:
    "Exact regular Scraps AvatarButton API, letter and image avatar resolution, deterministic swatches, image sampling, Button behavior, workbench, and standalone registry delivery use literal Tailwind classes. AvatarButton tooltipProps inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no approved AvatarButton Figma node.",
  backdrop:
    "Exact regular Scraps Backdrop geometry and theme surface use literal Tailwind classes. Layer values, reduced-motion behavior, focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  button:
    "Exact regular Scraps Button, LinkButton, and ButtonBar consumer contracts, Tailwind styling, documented states, focused assertions, production playground behavior, standalone registry delivery, and local Code Connect mapping are present. ButtonTooltipProps inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The mapping preserves the pinned priority, size, state, and Children Figma vocabulary under the Scrapscn React label. The explicit DO_NOT_USE_getButtonStyles exclusion is an Emotion StrictCSSObject helper used only by the monolith implementation and is not part of the portable consumer contract.",
  code: "Exact regular Scraps InlineCode and CodeBlock consumer contracts, Prism behavior, styling, localization seam, shared Button and Tooltip composition, documented states, focused assertions, production playground behavior, and standalone registry delivery use Tailwind without a CSS-in-JS runtime. The canonical module has no Figma component. The explicit inlineCodeStyles exclusion is an Emotion SerializedStyles factory for styled-component composition, not a portable component export.",
  chip: "Exact regular Scraps Chip API, query text, xs, sm, and md geometry, readonly and dismissable discriminated states, exact close icon, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  checkbox:
    "Exact regular Scraps Checkbox API, native form behavior, sizes, checked and indeterminate states, disabled treatment, focus ring, interaction layer, workbench, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. The mapping preserves the live size, checked, and state property vocabulary under the Scrapscn React label.",
  emptyState:
    "Exact regular Scraps EmptyState structure, workbench, focused tests, server boundary, registry item, and local parserless Code Connect mapping are present. The mapping preserves the exact pinned MDX branch URL and has no property vocabulary to invent under the Scrapscn React label.",
  chat: "Exact regular Scraps Chat exports, message geometry, feedback and copy behavior, ToolCall details and references, tool status semantics, spinner motion, live and completed thinking behavior, canonical icons, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes and static global keyframes. The canonical module has no Figma node or Code Connect source.",
  markdown:
    "Exact regular Scraps Markdown exports, marked token and custom tag parsing, non-overridable link and HTML safety, component overrides, default composition, grapheme-safe streaming decode behavior, workbench, production browser behavior, and a locally built registry artifact with a validated dependency closure use literal Tailwind classes and static CSS. Hosted registry installation is a separate release gate. The canonical module has no Figma node or Code Connect source.",
  dragHandle:
    "Exact regular Scraps drag handle line, target, orientation, ghost, held, focus, and reduced-motion states use literal Tailwind classes. Pointer and keyboard behavior, focused assertions, workbench, and standalone registry delivery are present. The canonical module has no Figma component.",
  interactionStateLayer:
    "Exact state-layer consumer contract and parent hover, press, selection, expansion, and disabled behavior use literal Tailwind selectors. Focused Storybook assertions, registry publication, and the checkbox playground integration are present. The canonical module has no Figma component.",
  hotkey:
    "Exact regular Scraps Hotkey, Kbd, and useHotkeys display and behavior contracts use literal Tailwind classes. Platform mapping, listener lifecycle, tests, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  info: "Exact regular Scraps InfoText, InfoTip, and DisabledTip APIs, overflow-only behavior, tooltip integration, focus handling, icon paths and sizes, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  disclosure:
    "Exact regular Scraps Disclosure compound API, React Aria controlled and uncontrolled state, keyboard behavior, size and outline geometry, canonical chevron path, slots, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  pagination:
    "Exact regular Scraps Pagination, Link header parsing, cursor caption, button geometry, callback signature, standalone browser navigation, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  toast:
    "Exact regular Scraps Toast API, indicator contract, motion, type rails, icons, spinner, dismiss and undo bubbling behavior, host locale delegation, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The Toast MDX URL is the generic Button node, not an approved Toast Figma node.",
  menuListItem:
    "Exact regular Scraps MenuListItem API, states, slots, tooltip, fixed details overlay, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. MenuListItemProps.tooltipOptions inherits the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The canonical module has no MenuListItem Figma node.",
  pictureInPicture:
    "Exact regular Scraps PictureInPicture provider, hook, portal, native window lifecycle, synchronous compiled Tailwind CSS transfer into the isolated browser-created document, relative asset resolution, theme synchronization, tooltip container, workbench, production browser behavior, and standalone registry delivery are present without a CSS-in-JS runtime or main-document style injection. The canonical module has no approved PictureInPicture Figma node.",
  link: "Exact regular Scraps Link, ExternalLink, behavior-provider, tracking, focus, disabled, router, focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  loader:
    "Exact regular Scraps Loader API, progress semantics, server boundary, workbench, template workflow, production browser behavior, and standalone registry delivery use literal Tailwind classes with static keyframes in plain CSS. The canonical module has no Figma component.",
  quote:
    "Exact regular Scraps Quote API, semantics, rail geometry, source variants, server boundary, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  radio:
    "Exact regular Scraps Radio API, native form behavior, xs, sm, and md geometry, checked and disabled states, focus treatment, motion, workbench, production browser behavior, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. The mapping preserves the live size, checked, and state property vocabulary under the Scrapscn React label.",
  slot: "Exact regular Scraps typed portal slot contract, logical size and container-query context bridge, focused assertions, and registry publication are present. The canonical module has no Figma component.",
  statusIndicator:
    "Exact regular Scraps StatusIndicator geometry, semantic tokens, accessibility, and finite or infinite motion use literal Tailwind classes with a keyframes-only CSS resource. Focused assertions, workbench, and standalone registry delivery are present. The canonical module has no Figma component.",
  table:
    "Exact regular Scraps Table grid, subgrid, sticky head, divider, sortable header, overflow tooltip, status, resizer styling and behavior, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  text: "Exact regular Scraps Text, Heading, and Prose consumer contracts use a drift-checked finite literal Tailwind candidate matrix. Typography, responsive container and viewport precedence, deprecated inline styles, raw code and keycap recipes, focused assertions, workbench, production browser behavior, and standalone registry delivery are present. The canonical module has no Figma component.",
  tabs: "Exact regular Scraps Tabs, TabStateProvider, TabList.Item, and TabPanels.Item contracts, controlled and uncontrolled selection, manual keyboard activation, disabled and hidden items, horizontal overflow, links, tooltips, sizes, orientations, variants, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes and pinned theme tokens. TabListItemProps.tooltip and the legacy internal tooltipProps path inherit the shared TooltipProps.overlayStyle portable-contract input exclusion recorded in scope.excludedContractInputs. The Tabs MDX resource resolves to the generic Button node, so Tabs has no Code Connect mapping or Figma property vocabulary.",
  textarea:
    "Exact regular Scraps TextArea consumer contract, native behavior, xs, sm, and md geometry, width-aware autosizing, monospace and disabled states, workbench, production browser behavior, standalone registry delivery, and local Code Connect mapping use literal Tailwind classes. The mapping preserves the pinned size and state Figma vocabulary under the Scrapscn React label.",
  input:
    "Exact regular Scraps Input, InputGroup, NumberInput, NumberDragInput, OTPInput, and useAutosizeInput contracts, native behavior, OTP format and completion behavior, measured compound padding, React Aria number semantics, pointer and keyboard adjustment, autosize cleanup, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes. The canonical module has no Input-specific Code Connect file or approved Input Figma node.",
  image:
    "Exact regular Scraps Image native element contract, responsive dimensions, object fit, position, aspect ratio, and radius use the literal Tailwind Layout matrix. Focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  revealOnHover:
    "Exact regular Scraps RevealOnHover render branches, hover and focus visibility, timing, and reduced-motion behavior use literal Tailwind selectors and the Tailwind Layout clone. Focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  separator:
    "Exact regular Scraps Separator geometry, directional semantic borders, responsive spacing, Stack orientation behavior, workbench, and standalone registry delivery use the shared literal Tailwind property and breakpoint matrix.",
  slideOverPanel:
    "Exact regular Scraps SlideOverPanel API, deferred content, motion, navigation offset, boundary context, responsive placement, theme surface, workbench, and standalone registry delivery use literal Tailwind classes. The canonical module has no Figma component.",
  splitPanel:
    "Exact regular Scraps SplitPanel contract, pane geometry, sizing, iframe drag lock, and responsive composition use literal Tailwind selectors and the Tailwind Layout clone. Focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.",
  badge:
    "Exact regular Scraps Badge, Tag, FeatureBadge, AlertBadge, DeployBadge, and ProjectsBadge runtime behavior, literal Tailwind geometry, canonical Sentry icon paths, theme tokens, workbench, focused tests, one self-contained registry item, and parserless canonical Code Connect mappings are present. Focused evidence covers runtime variant errors, React 19 callback-ref cleanup, the complete private Deploy shape, the pinned release-token output oracle, default-only Tag icon sizing, roving role=tab focus, and render-time host locale resolution. The explicit portable-contract input exclusion for TooltipProps.overlayStyle is owner-authorized and recorded in scope.excludedContractInputs. The live FeatureBadge Figma instance currently exposes deprecated and Variant properties instead of the pinned canonical five-value type property, so the mapping preserves the canonical type vocabulary without inventing incompatible runtime props.",
  form: "Exact regular Scraps Form consumer behavior is present: the 12-export barrel, 94-entry settings-search registry, TanStack form contexts, default validation, RequestError-only backend field mapping, canonical request-error messages, Base/Input/Number/Password/Radio/Range/Select/SelectAsync/Switch/TextArea/Meta/Layout bindings, confirmation lifecycle, auto-save failure recovery, multi-select save timing, focused tests, workbench, and standalone registry item. Bound submit and reset buttons retain the shared TooltipProps.overlayStyle portable-contract input exclusion in scope.excludedContractInputs. The canonical Form module has no Figma node or Code Connect property vocabulary.",
  slider:
    "Exact regular Scraps Slider API, React Aria behavior, geometry, registry, workbench, focused tests, and local parserless Code Connect mapping are present. The canonical mapping has an exact empty props map, so the local mapping intentionally emits no property access under the Scrapscn React label.",
  switch:
    "Exact regular Scraps Switch API, behavior, visual states, registry, workbench, focused tests, and local parserless Code Connect mapping are present. The mapping preserves exactly the canonical size sm|lg and checked boolean vocabulary under the Scrapscn React label.",
  segmentedControl:
    "SegmentedControl behavior, exact Tailwind styling, workbench, focused tests, and standalone registry delivery are present. The explicit portable-contract input exclusion for TooltipProps.overlayStyle is owner-authorized and recorded in scope.excludedContractInputs. The canonical MDX Figma resource resolves to frame 384:2119 named Button, so it provides no SegmentedControl component or property vocabulary to map.",
  select:
    "Exact regular Scraps Select exports, discriminated value contracts, controlled and default state, async and creatable behavior, form serialization, keyboard and pointer actions, portal placement, 25 replacement slots, workbench, focused tests, and standalone registry delivery use literal Tailwind classes and pinned theme tokens. Flat StylesConfig declarations and every nested selector pattern used by pinned monolith callers apply to the default DOM. Replacement components receive the complete callback result through getStyles. The open-ended arbitrary nested-selector input is an owner-authorized portable-contract exclusion recorded in scope.excludedContractInputs because applying unknown runtime selectors would require CSS-in-JS or stylesheet injection. SelectValue also inherits the shared TooltipProps.overlayStyle exclusion. The canonical Select MDX resource resolves to the generic Button node, so Select has no Code Connect mapping or Figma property vocabulary.",
  tooltip:
    "The local Tooltip API, synchronous disabled reset, positioning, delay group, overflow observation, motion, literal Tailwind styling, workbench, focused tests, production browser behavior, self-contained registry item, and local Code Connect mapping are present. The mapping preserves the pinned Text and position property vocabulary under the Scrapscn React label. CSSProperties overrides remain supported. The explicit portable-contract input exclusion for SerializedStyles is owner-authorized and recorded in scope.excludedContractInputs.",
  layout:
    "Exact regular Scraps Container, Flex, Grid, Stack, Surface, responsive cascade, container-query behavior, workbench, focused tests, and standalone registry delivery use generated literal Tailwind classes for every finite render-function domain. Ordinary intrinsic elements retain inline CSS-variable support for arbitrary CSSProperties values. The no-wrapper render-function form accepts finite fields and rejects CSS-in-JS-coupled arbitrary fields; migrate those values to an owned element or static Tailwind/CSS in the target component.",
};
const partialEvidence = {};

const figmaNodes = {
  breadcrumbList: ["https://www.figma.com/design/a638AEl7pFxj29zMODCiOB?node-id=1198-17420"],
  alert: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6943-13522"],
  badge: [
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5698",
    "https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5396",
  ],
  button: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=384-2119"],
  checkbox: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3481-4211"],
  emptyState: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=13363-6895"],
  radio: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3482-4251"],
  slider: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3538-6616"],
  switch: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3277-4566"],
  textarea: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3537-20061"],
  tooltip: ["https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6775-627"],
};

const outOfScopeComponents = [
  "src/components/ui/boundary-context.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/datetime.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/label.tsx",
  "src/components/ui/link-playground-adapter.tsx",
  "src/components/ui/overlay-trigger.tsx",
  "src/components/ui/progress.tsx",
  "src/components/ui/scroll-area.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/size-context.tsx",
  "src/components/ui/slide-over-panel-environment.tsx",
  "src/components/ui/translation-context.tsx",
  "src/components/ui/use-scroll-lock.tsx",
];

function readCanonicalFile(repositoryPath) {
  return execFileSync("git", ["show", `${CANONICAL_COMMIT}:${repositoryPath}`], {
    cwd: sentryRepository,
    encoding: "utf8",
  });
}

function canonicalPathExists(repositoryPath) {
  try {
    execFileSync("git", ["cat-file", "-e", `${CANONICAL_COMMIT}:${repositoryPath}`], {
      cwd: sentryRepository,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function resolveCanonicalSource(moduleDirectory, moduleSpecifier) {
  const base = path.posix.join(moduleDirectory, moduleSpecifier);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.posix.join(base, "index.tsx"),
    path.posix.join(base, "index.ts"),
  ]) {
    if (canonicalPathExists(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Parity manifest source missing: ${moduleSpecifier}`);
}

function readCanonicalModule(moduleName) {
  const moduleDirectory = path.posix.join(canonicalRoot, moduleName);
  const indexFilename = canonicalPathExists(path.posix.join(moduleDirectory, "index.tsx"))
    ? "index.tsx"
    : "index.ts";
  const indexPath = path.posix.join(moduleDirectory, indexFilename);
  const source = readCanonicalFile(indexPath);
  const sourceFile = ts.createSourceFile(
    indexFilename,
    source,
    ts.ScriptTarget.Latest,
    true,
    indexFilename.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const sourcePaths = new Set([indexPath]);

  for (const statement of sourceFile.statements) {
    if (
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith(".")
    ) {
      sourcePaths.add(resolveCanonicalSource(moduleDirectory, statement.moduleSpecifier.text));
    }
  }

  return {
    indexPath,
    sourcePaths: [
      ...sourcePaths,
      ...(canonicalBehaviorDependencies[moduleName] ?? []).filter(canonicalPathExists),
    ].sort(),
    publicExports: collectParityManifestExports(source, indexFilename),
    excludedExports:
      moduleName === "button"
        ? { runtime: ["DO_NOT_USE_getButtonStyles"], types: [] }
        : moduleName === "code"
          ? { runtime: ["inlineCodeStyles"], types: [] }
          : { runtime: [], types: [] },
  };
}

async function existingPaths(paths) {
  const result = [];
  for (const candidate of paths) {
    try {
      await access(candidate);
      result.push(candidate);
    } catch {}
  }
  return result;
}

const canonicalInventory = discoverCanonicalInventory({
  commit: CANONICAL_COMMIT,
  repository: sentryRepository,
});
for (const [canonicalPath, coverage] of Object.entries(standaloneApiCoverage)) {
  const canonicalEntry = canonicalInventory.standaloneFiles.find(
    ({ path: standalonePath }) => standalonePath === canonicalPath,
  );
  if (!canonicalEntry?.publicExports) {
    throw new Error(`Standalone public API is missing export inventory: ${canonicalPath}`);
  }
  coverage.canonicalPublicExports = canonicalEntry.publicExports;
  coverage.excludedExports = coverage.excludedExports ?? { runtime: [], types: [] };
  coverage.implementedExports =
    coverage.state === "complete"
      ? await collectParityManifestFileExports(coverage.localPaths)
      : { runtime: [], types: [] };
}
const moduleNames = canonicalInventory.componentEntryPoints.map(({ name }) => name);
const baseManifestPath = process.env.PARITY_BASE_MANIFEST ?? "scraps-parity.json";
let baseManifest;
try {
  baseManifest = JSON.parse(await readFile(baseManifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const comparisonBaseCommit =
  process.env.PARITY_COMPARISON_BASE_COMMIT ??
  baseManifest?.canonical?.comparisonBaseCommit ??
  baseManifest?.canonical?.commit ??
  CANONICAL_COMMIT;
const excludedContractInputs = await collectPinnedExcludedContractInputClosure({
  canonicalRepository: sentryRepository,
  dependencyRepository: sentryDependencyRepository,
  moduleNames,
});

const modules = [];
for (const moduleName of moduleNames) {
  const implementationPaths = [...(localModules[moduleName] ?? [])].sort();
  const publicExportPaths =
    moduleName === "select"
      ? ["src/components/ui/select.tsx"]
      : moduleName === "form"
        ? ["src/components/ui/form.tsx"]
        : moduleName === "avatar"
          ? ["src/components/ui/avatar.tsx"]
          : implementationPaths;
  const kebabName = moduleName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const stories = await existingPaths(
    (moduleName === "select" ? ["src/components/ui/select.tsx"] : implementationPaths)
      .filter((implementationPath) => implementationPath.endsWith(".tsx"))
      .map((implementationPath) => implementationPath.replace(/\.tsx$/, ".stories.tsx")),
  );
  const tests =
    moduleName === "badge"
      ? [
          "src/components/ui/badge.test.tsx",
          "tests/e2e/playground.spec.ts",
          "tests/figma/badge-code-connect.test.mjs",
          "tests/parity/badge.test.mjs",
          "tests/types/badge-types.test.tsx",
        ]
      : moduleName === "select"
        ? [
            "src/components/ui/select.test.tsx",
            "tests/e2e/playground.spec.ts",
            "tests/parity/select.test.mjs",
            "tests/types/select-types.test.tsx",
          ]
        : moduleName === "form"
          ? [
              "src/components/ui/form.test.tsx",
              "tests/e2e/playground.spec.ts",
              "tests/parity/form.test.mjs",
              "tests/types/form-types.test.tsx",
            ]
          : moduleName === "alert"
            ? [
                "src/components/ui/alert.test.tsx",
                "tests/e2e/playground.spec.ts",
                "tests/parity/alert.test.mjs",
                "tests/types/alert-types.test.tsx",
              ]
            : moduleName === "checkbox"
              ? [
                  "src/components/ui/checkbox.test.tsx",
                  "tests/e2e/playground.spec.ts",
                  "tests/e2e/templates.spec.ts",
                  "tests/figma/figma-preview.test.mjs",
                  "tests/parity/checkbox.test.mjs",
                  "tests/types/checkbox-types.test.tsx",
                ]
              : moduleName === "segmentedControl"
                ? [
                    "src/components/ui/segmented-control.test.tsx",
                    "tests/e2e/playground.spec.ts",
                    "tests/parity/segmented-control.test.mjs",
                    "tests/types/segmented-control-types.test.tsx",
                  ]
                : moduleName === "slider"
                  ? [
                      "src/components/ui/slider.test.tsx",
                      "tests/e2e/playground.spec.ts",
                      "tests/parity/slider.test.mjs",
                      "tests/types/slider-types.test.tsx",
                    ]
                  : moduleName === "switch"
                    ? [
                        "src/components/ui/switch.test.tsx",
                        "tests/e2e/playground.spec.ts",
                        "tests/parity/switch.test.mjs",
                        "tests/types/switch-types.test.tsx",
                      ]
                    : moduleName === "tabs"
                      ? [
                          "src/components/ui/tabs.test.tsx",
                          "tests/e2e/playground.spec.ts",
                          "tests/parity/tabs.test.mjs",
                          "tests/types/tabs-types.test.tsx",
                        ]
                      : moduleName === "interactionStateLayer"
                        ? [
                            "tests/e2e/playground.spec.ts",
                            "tests/parity/interaction-state-layer.test.mjs",
                          ]
                        : moduleName === "chat"
                          ? [
                              "src/components/ui/chat.test.tsx",
                              "tests/e2e/playground.spec.ts",
                              "tests/e2e/templates.spec.ts",
                              "tests/parity/chat.test.mjs",
                              "tests/types/chat-types.test.tsx",
                            ]
                          : moduleName === "markdown"
                            ? [
                                "src/components/ui/markdown.test.tsx",
                                "tests/e2e/playground.spec.ts",
                                "tests/e2e/templates.spec.ts",
                                "tests/parity/markdown.test.mjs",
                                "tests/types/markdown-types.test.tsx",
                              ]
                            : moduleName === "layout" || moduleName === "separator"
                              ? [
                                  "src/components/ui/layout.test.tsx",
                                  "tests/e2e/playground.spec.ts",
                                  "tests/parity/layout-separator-ssr.test.mjs",
                                  "tests/parity/layout-separator.test.mjs",
                                ]
                              : moduleName === "slot"
                                ? [
                                    "src/components/ui/slot.test.tsx",
                                    "tests/e2e/playground.spec.ts",
                                    "tests/parity/slot.test.mjs",
                                  ]
                                : moduleName === "dragHandle"
                                  ? [
                                      "src/components/ui/drag-handle.test.tsx",
                                      "tests/e2e/playground.spec.ts",
                                      "tests/parity/drag-handle.test.mjs",
                                    ]
                                  : moduleName === "splitPanel"
                                    ? [
                                        "src/components/ui/split-panel.test.tsx",
                                        "tests/e2e/playground.spec.ts",
                                        "tests/parity/split-panel.test.mjs",
                                        "tests/types/split-panel-types.test.tsx",
                                      ]
                                    : moduleName === "table"
                                      ? [
                                          "src/components/ui/table.test.tsx",
                                          "tests/e2e/playground.spec.ts",
                                          "tests/parity/table.test.mjs",
                                          "tests/types/table-types.test.tsx",
                                        ]
                                      : moduleName === "statusIndicator"
                                        ? [
                                            "src/components/ui/status-indicator.test.tsx",
                                            "tests/e2e/playground.spec.ts",
                                            "tests/parity/status-indicator.test.mjs",
                                            "tests/types/status-indicator-types.test.tsx",
                                          ]
                                        : moduleName === "revealOnHover"
                                          ? [
                                              "src/components/ui/reveal-on-hover.test.tsx",
                                              "tests/e2e/playground.spec.ts",
                                              "tests/parity/reveal-on-hover.test.mjs",
                                              "tests/types/reveal-on-hover-types.test.tsx",
                                            ]
                                          : moduleName === "hotkey"
                                            ? [
                                                "src/components/ui/hotkey.test.tsx",
                                                "tests/e2e/playground.spec.ts",
                                                "tests/parity/hotkey.test.mjs",
                                                "tests/types/hotkey-types.test.tsx",
                                              ]
                                            : moduleName === "image"
                                              ? [
                                                  "src/components/ui/image.test.tsx",
                                                  "tests/e2e/playground.spec.ts",
                                                  "tests/parity/image.test.mjs",
                                                  "tests/types/image-types.test.tsx",
                                                ]
                                              : moduleName === "backdrop"
                                                ? [
                                                    "src/components/ui/backdrop.test.tsx",
                                                    "tests/e2e/playground.spec.ts",
                                                    "tests/parity/backdrop.test.mjs",
                                                    "tests/types/backdrop-types.test.tsx",
                                                  ]
                                                : moduleName === "code"
                                                  ? [
                                                      "src/components/ui/code.test.tsx",
                                                      "src/components/ui/prism-concurrent.test.ts",
                                                      "src/components/ui/prism.test.ts",
                                                      "tests/e2e/playground.spec.ts",
                                                      "tests/parity/code.test.mjs",
                                                      "tests/types/code-types.test.tsx",
                                                    ]
                                                  : moduleName === "emptyState"
                                                    ? [
                                                        "src/app/evidence/empty-state-server/page.tsx",
                                                        "src/components/ui/empty-state.test.tsx",
                                                        "tests/e2e/playground.spec.ts",
                                                        "tests/parity/empty-state.test.mjs",
                                                        "tests/types/empty-state-types.test.tsx",
                                                      ]
                                                    : moduleName === "loader"
                                                      ? [
                                                          "src/app/evidence/loader-server/page.tsx",
                                                          "src/components/ui/loader.test.tsx",
                                                          "tests/e2e/playground.spec.ts",
                                                          "tests/e2e/templates.spec.ts",
                                                          "tests/parity/loader.test.mjs",
                                                          "tests/types/loader-types.test.tsx",
                                                        ]
                                                      : moduleName === "slideOverPanel"
                                                        ? [
                                                            "src/components/ui/slide-over-panel.test.tsx",
                                                            "tests/e2e/playground.spec.ts",
                                                            "tests/parity/slide-over-panel.test.mjs",
                                                            "tests/types/slide-over-panel-types.test.tsx",
                                                          ]
                                                        : moduleName === "tooltip"
                                                          ? [
                                                              "src/components/ui/tooltip.test.tsx",
                                                              "tests/e2e/playground.spec.ts",
                                                              "tests/parity/tooltip.test.mjs",
                                                              "tests/types/tooltip-types.test.tsx",
                                                            ]
                                                          : moduleName === "textarea"
                                                            ? [
                                                                "src/components/ui/textarea.test.tsx",
                                                                "tests/e2e/playground.spec.ts",
                                                                "tests/parity/textarea.test.mjs",
                                                                "tests/types/textarea-types.test.tsx",
                                                              ]
                                                            : moduleName === "input"
                                                              ? [
                                                                  "src/components/ui/input.test.tsx",
                                                                  "tests/e2e/playground.spec.ts",
                                                                  "tests/parity/input.test.mjs",
                                                                  "tests/types/input-types.test.tsx",
                                                                ]
                                                              : moduleName === "breadcrumbList"
                                                                ? [
                                                                    "src/components/ui/breadcrumb-list.test.tsx",
                                                                    "tests/e2e/playground.spec.ts",
                                                                    "tests/parity/breadcrumb-list.test.mjs",
                                                                    "tests/types/breadcrumb-list-types.test.tsx",
                                                                  ]
                                                                : moduleName === "compactSelect"
                                                                  ? [
                                                                      "src/components/ui/compact-select.test.tsx",
                                                                      "tests/e2e/playground.spec.ts",
                                                                      "tests/parity/compact-select.test.mjs",
                                                                      "tests/types/compact-select-types.test.tsx",
                                                                    ]
                                                                  : moduleName === "modal"
                                                                    ? [
                                                                        "src/components/ui/modal.test.tsx",
                                                                        "tests/e2e/playground.spec.ts",
                                                                        "tests/parity/modal.test.mjs",
                                                                        "tests/types/modal-types.test.tsx",
                                                                      ]
                                                                    : moduleName === "drawer"
                                                                      ? [
                                                                          "src/components/ui/drawer.test.tsx",
                                                                          "tests/e2e/playground.spec.ts",
                                                                          "tests/parity/drawer.test.mjs",
                                                                          "tests/types/drawer-types.test.tsx",
                                                                        ]
                                                                      : moduleName === "link"
                                                                        ? [
                                                                            "src/components/ui/link.test.tsx",
                                                                            "tests/e2e/playground.spec.ts",
                                                                            "tests/parity/link.test.mjs",
                                                                            "tests/types/link-types.test.tsx",
                                                                          ]
                                                                        : moduleName === "button"
                                                                          ? [
                                                                              "src/components/ui/button.test.tsx",
                                                                              "tests/e2e/playground.spec.ts",
                                                                              "tests/parity/button.test.mjs",
                                                                              "tests/types/button-types.test.tsx",
                                                                            ]
                                                                          : moduleName === "radio"
                                                                            ? [
                                                                                "src/components/ui/radio.test.tsx",
                                                                                "tests/e2e/playground.spec.ts",
                                                                                "tests/parity/radio.test.mjs",
                                                                                "tests/types/radio-types.test.tsx",
                                                                              ]
                                                                            : moduleName === "chip"
                                                                              ? [
                                                                                  "src/components/ui/chip.test.tsx",
                                                                                  "tests/e2e/playground.spec.ts",
                                                                                  "tests/parity/chip.test.mjs",
                                                                                  "tests/types/chip-types.test.tsx",
                                                                                ]
                                                                              : moduleName ===
                                                                                  "info"
                                                                                ? [
                                                                                    "src/components/ui/info.test.tsx",
                                                                                    "tests/e2e/playground.spec.ts",
                                                                                    "tests/e2e/templates.spec.ts",
                                                                                    "tests/parity/info.test.mjs",
                                                                                    "tests/types/info-types.test.tsx",
                                                                                  ]
                                                                                : moduleName ===
                                                                                    "disclosure"
                                                                                  ? [
                                                                                      "src/components/ui/disclosure.test.tsx",
                                                                                      "tests/e2e/playground.spec.ts",
                                                                                      "tests/parity/disclosure.test.mjs",
                                                                                      "tests/types/disclosure-types.test.tsx",
                                                                                    ]
                                                                                  : moduleName ===
                                                                                      "pagination"
                                                                                    ? [
                                                                                        "src/components/ui/pagination.test.tsx",
                                                                                        "tests/e2e/playground.spec.ts",
                                                                                        "tests/parity/pagination.test.mjs",
                                                                                        "tests/types/pagination-types.test.tsx",
                                                                                      ]
                                                                                    : moduleName ===
                                                                                        "toast"
                                                                                      ? [
                                                                                          "src/components/ui/toast.test.tsx",
                                                                                          "tests/e2e/playground.spec.ts",
                                                                                          "tests/e2e/templates.spec.ts",
                                                                                          "tests/parity/toast.test.mjs",
                                                                                          "tests/types/toast-types.test.tsx",
                                                                                        ]
                                                                                      : moduleName ===
                                                                                          "menuListItem"
                                                                                        ? [
                                                                                            "src/components/ui/menu-list-item.test.tsx",
                                                                                            "tests/e2e/playground.spec.ts",
                                                                                            "tests/e2e/templates.spec.ts",
                                                                                            "tests/parity/menu-list-item.test.mjs",
                                                                                            "tests/types/menu-list-item-types.test.tsx",
                                                                                          ]
                                                                                        : moduleName ===
                                                                                            "pictureInPicture"
                                                                                          ? [
                                                                                              "src/components/ui/picture-in-picture.test.tsx",
                                                                                              "tests/e2e/playground.spec.ts",
                                                                                              "tests/e2e/templates.spec.ts",
                                                                                              "tests/parity/picture-in-picture.test.mjs",
                                                                                              "tests/types/picture-in-picture-types.test.tsx",
                                                                                            ]
                                                                                          : moduleName ===
                                                                                              "avatarButton"
                                                                                            ? [
                                                                                                "src/components/ui/avatar-button.test.tsx",
                                                                                                "tests/e2e/playground.spec.ts",
                                                                                                "tests/e2e/templates.spec.ts",
                                                                                                "tests/parity/avatar-button.test.mjs",
                                                                                                "tests/types/avatar-button-types.test.tsx",
                                                                                              ]
                                                                                            : moduleName ===
                                                                                                "avatar"
                                                                                              ? [
                                                                                                  "src/components/ui/avatar.test.tsx",
                                                                                                  "tests/e2e/playground.spec.ts",
                                                                                                  "tests/parity/avatar.test.mjs",
                                                                                                  "tests/types/avatar-types.test.tsx",
                                                                                                ]
                                                                                              : moduleName ===
                                                                                                  "quote"
                                                                                                ? [
                                                                                                    "src/app/evidence/quote-server/page.tsx",
                                                                                                    "src/components/ui/quote.test.tsx",
                                                                                                    "tests/e2e/playground.spec.ts",
                                                                                                    "tests/parity/quote.test.mjs",
                                                                                                    "tests/types/quote-types.test.tsx",
                                                                                                  ]
                                                                                                : moduleName ===
                                                                                                    "text"
                                                                                                  ? [
                                                                                                      "src/components/ui/text.test.tsx",
                                                                                                      "tests/e2e/playground.spec.ts",
                                                                                                      "tests/parity/text-ssr.test.mjs",
                                                                                                      "tests/parity/text.test.mjs",
                                                                                                      "tests/types/text-types.test.tsx",
                                                                                                    ]
                                                                                                  : [];
  const completionNote = completionEvidence[moduleName];
  const moduleExcludedContractInputs = contractInputsForModule(excludedContractInputs, moduleName);

  modules.push({
    name: moduleName,
    canonical: await readCanonicalModule(moduleName),
    local: {
      implementationPaths,
      implementedExports: await collectParityManifestFileExports(publicExportPaths),
      registryItems: [...(registryItems[moduleName] ?? [])].sort(),
      stories,
      tests,
      codeConnect: [...(codeConnectFiles[moduleName] ?? [])].sort(),
      figmaNodes: [...(figmaNodes[moduleName] ?? [])].sort(),
      playgroundPath:
        moduleName === "badge"
          ? "/?component=badge"
          : moduleName === "select"
            ? "/?component=select"
            : moduleName === "form"
              ? "/?component=form"
              : moduleName === "alert"
                ? "/?component=alert"
                : moduleName === "dragHandle"
                  ? "/?component=drag-handle"
                  : moduleName === "splitPanel"
                    ? "/?component=split-panel"
                    : moduleName === "table"
                      ? "/?component=table"
                      : moduleName === "statusIndicator"
                        ? "/?component=status-indicator"
                        : moduleName === "revealOnHover"
                          ? "/?component=reveal-on-hover"
                          : moduleName === "hotkey"
                            ? "/?component=hotkey"
                            : moduleName === "image"
                              ? "/?component=image"
                              : moduleName === "backdrop"
                                ? "/?component=backdrop"
                                : moduleName === "slideOverPanel"
                                  ? "/?component=slide-over-panel"
                                  : moduleName === "tooltip"
                                    ? "/?component=tooltip"
                                    : moduleName === "textarea"
                                      ? "/?component=textarea"
                                      : moduleName === "input"
                                        ? "/?component=input"
                                        : moduleName === "breadcrumbList"
                                          ? "/?component=breadcrumb-list"
                                          : moduleName === "compactSelect"
                                            ? "/?component=compact-select"
                                            : moduleName === "modal"
                                              ? "/?component=modal"
                                              : moduleName === "drawer"
                                                ? "/?component=drawer"
                                                : moduleName === "link"
                                                  ? "/?component=link"
                                                  : moduleName === "button"
                                                    ? "/?component=button"
                                                    : moduleName === "chat"
                                                      ? "/?component=chat"
                                                      : moduleName === "markdown"
                                                        ? "/?component=markdown"
                                                        : moduleName === "radio"
                                                          ? "/?component=radio"
                                                          : moduleName === "segmentedControl"
                                                            ? "/?component=segmented-control"
                                                            : moduleName === "chip"
                                                              ? "/?component=chip"
                                                              : moduleName === "info"
                                                                ? "/?component=info"
                                                                : moduleName === "disclosure"
                                                                  ? "/?component=disclosure"
                                                                  : moduleName === "pagination"
                                                                    ? "/?component=pagination"
                                                                    : moduleName === "toast"
                                                                      ? "/?component=toast"
                                                                      : moduleName ===
                                                                          "menuListItem"
                                                                        ? "/?component=menu-list-item"
                                                                        : moduleName ===
                                                                            "pictureInPicture"
                                                                          ? "/?component=picture-in-picture"
                                                                          : moduleName ===
                                                                              "avatarButton"
                                                                            ? "/?component=avatar-button"
                                                                            : moduleName ===
                                                                                "avatar"
                                                                              ? "/?component=avatar"
                                                                              : moduleName ===
                                                                                  "code"
                                                                                ? "/?component=code"
                                                                                : moduleName ===
                                                                                    "emptyState"
                                                                                  ? "/?component=empty-state"
                                                                                  : moduleName ===
                                                                                      "loader"
                                                                                    ? "/?component=loader"
                                                                                    : moduleName ===
                                                                                        "quote"
                                                                                      ? "/?component=quote"
                                                                                      : moduleName ===
                                                                                          "text"
                                                                                        ? "/?component=text"
                                                                                        : moduleName ===
                                                                                            "interactionStateLayer"
                                                                                          ? "/?component=interaction-state-layer"
                                                                                          : moduleName ===
                                                                                              "layout"
                                                                                            ? "/?component=layout"
                                                                                            : moduleName ===
                                                                                                "separator"
                                                                                              ? "/?component=separator"
                                                                                              : moduleName ===
                                                                                                  "slot"
                                                                                                ? "/?component=slot"
                                                                                                : moduleName ===
                                                                                                    "slider"
                                                                                                  ? "/?component=slider"
                                                                                                  : moduleName ===
                                                                                                      "switch"
                                                                                                    ? "/?component=switch"
                                                                                                    : moduleName ===
                                                                                                        "tabs"
                                                                                                      ? "/?component=tabs"
                                                                                                      : moduleName ===
                                                                                                          "checkbox"
                                                                                                        ? "/?component=checkbox"
                                                                                                        : null,
    },
    completion: {
      state: completionNote ? "complete" : implementationPaths.length > 0 ? "partial" : "missing",
      complete: Boolean(completionNote),
      note:
        completionNote ??
        partialEvidence[moduleName] ??
        (moduleName === "emptyState"
          ? "The local EmptyState implementation exactly matches the pinned regular Scraps structure, and its workbench, focused tests, server boundary, and standalone registry item are present. The recorded Figma node is not a published component in live read-only Code Connect metadata, so it cannot receive a local mapping until the library publishes the component or supplies the current published node."
          : moduleName === "loader"
            ? "The Loader API and behavior are translated to literal Tailwind classes with only static animation keyframes in plain CSS. Unit, computed-style story, server, registry-build, and template evidence pass. The production playground E2E cannot run until this task has the required cmux and Portless access. No canonical Loader Figma node is recorded."
            : moduleName === "slideOverPanel"
              ? "The local SlideOverPanel implementation, navigation-offset environment seam, boundary context, deferred-content workbench, focused tests, and self-contained local registry item are present. The hosted registry endpoint is protected, so public installation is not verified. No canonical Figma node is recorded."
              : moduleName === "tooltip"
                ? "The local Tooltip API, positioning, delay group, overflow observation, motion, literal Tailwind styling, workbench, focused tests, production browser behavior, self-contained registry item, and local Code Connect mapping are present. The mapping preserves the pinned Text and position property vocabulary under the Scrapscn React label. CSSProperties overrides remain supported, but the CSS-in-JS-only SerializedStyles overlay input is excluded, so exact prop-type parity is not complete."
                : implementationPaths.length > 0
                  ? "A local implementation exists, but exact contract, behavior, visual, registry, and Figma gates have not all passed."
                  : `No local ${kebabName} implementation is mapped.`),
      ...(moduleExcludedContractInputs.length > 0
        ? { excludedContractInputs: moduleExcludedContractInputs }
        : {}),
    },
  });
}

const manifest = {
  schemaVersion: 3,
  canonical: {
    repository: "getsentry/sentry",
    commit: CANONICAL_COMMIT,
    comparisonBaseCommit,
    root: CANONICAL_ROOT,
    excludedDirectories: EXCLUDED_DIRECTORIES,
    inventory: canonicalInventory,
  },
  scope: {
    discoveredModuleCount: modules.length,
    excludedContractInputs,
    outOfScopeLocalComponents: outOfScopeComponents,
    standaloneApiCoverage: Object.entries(standaloneApiCoverage)
      .map(([canonicalPath, coverage]) => ({ canonicalPath, ...coverage }))
      .sort((left, right) => left.canonicalPath.localeCompare(right.canonicalPath)),
  },
  modules,
};

const manifestOutput = process.env.PARITY_MANIFEST_OUTPUT ?? "scraps-parity.json";
await writeFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Generated ${manifestOutput} with ${modules.length} modules.\n`);
