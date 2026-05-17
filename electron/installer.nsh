; Final Simplified NSIS Script for Clinic Hub

!macro customHeader
  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcut
!macroend

Function CreateDesktopShortcut
  SetOutPath "$INSTDIR"
  ; Use index 0 for the embedded icon
  CreateShortCut "$DESKTOP\Clinic Hub.lnk" "$INSTDIR\Clinic Hub.exe" "" "$INSTDIR\Clinic Hub.exe" 0
FunctionEnd
