Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    ' 結合セルの左上セルアドレスを取得
    Dim topLeftCell As String
    topLeftCell = Target.cells(1, 1).Address
    
    ' 指定された16箇所の結合セルを対象とする
    If topLeftCell = "$B$5" Or topLeftCell = "$L$5" Or topLeftCell = "$B$16" Or topLeftCell = "$L$16" Or topLeftCell = "$B$27" Or topLeftCell = "$L$27" Or topLeftCell = "$B$38" Or topLeftCell = "$L$38" Or topLeftCell = "$B$53" Or topLeftCell = "$L$53" Or topLeftCell = "$B$64" Or topLeftCell = "$L$64" Or topLeftCell = "$B$75" Or topLeftCell = "$L$75" Or topLeftCell = "$B$87" Or topLeftCell = "$L$87" Then
        Cancel = True
        Call InsertPictureToCell(Target)
    End If
End Sub

' キーが押された時のイベント
Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    ' 少し遅延してからクリーンアップ
    ' Application.OnTime Now + TimeSerial(0, 0, 1), "ForceCleanup"
End Sub

Sub InsertPictureToCell(ByVal targetRange As Range)
    Dim pic As Shape
    Dim picPath As Variant
    Dim picName As String
    
    ' 一意の画像名を生成
    Dim topLeftCell As String
    topLeftCell = targetRange.cells(1, 1).Address
    picName = Me.Name & "_" & Replace(topLeftCell, "$", "") & "_pic"
    
    ' ファイル選択
    picPath = Application.GetOpenFilename()
    If picPath = False Then Exit Sub
    
    On Error Resume Next
    Me.Shapes(picName).Delete
    On Error GoTo 0
    
    
    ' 画像挿入
    Set pic = Me.Shapes.AddPicture(picPath, False, True, _
                                   targetRange.Left, targetRange.Top, _
                                   targetRange.Width, targetRange.Height)
    pic.Name = picName
    
    ' 自動保存して確実に埋め込み
    Application.DisplayAlerts = False
    ThisWorkbook.Save
    Application.DisplayAlerts = True
    
    ' 画面更新
    DoEvents
    Application.ScreenUpdating = True
End Sub

' 標準モジュールに追加する強力なクリーンアップ
Sub ForceCleanup()
    On Error Resume Next
    
    ' アクティブシートを取得
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    ' 複数の方法で画面をリフレッシュ
    Application.ScreenUpdating = False
    Application.ScreenUpdating = True
    DoEvents
    
    ' ズームを変更して戻す（強制リフレッシュ）
    Dim currentZoom As Integer
    currentZoom = ActiveWindow.Zoom
    ActiveWindow.Zoom = currentZoom + 1
    ActiveWindow.Zoom = currentZoom
    
    ' 再計算
    ws.Calculate
    Application.Calculate
    DoEvents
    
    ' 保存
    Application.DisplayAlerts = False
    ThisWorkbook.Save
    Application.DisplayAlerts = True
    
    On Error GoTo 0
End Sub
