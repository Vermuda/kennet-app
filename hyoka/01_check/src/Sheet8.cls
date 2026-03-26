Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    ' 結合セルの左上セルアドレスを取得
    Dim topLeftCell As String
    Dim targetCell As Range
    Dim mergeArea As Range

    On Error Resume Next

    ' 結合セルの場合は、結合範囲の左上セルを取得
    If Target.MergeCells Then
        Set mergeArea = Target.mergeArea
        If Not mergeArea Is Nothing Then
            Set targetCell = mergeArea.cells(1, 1)
        Else
            Set targetCell = Target.cells(1, 1)
        End If
    Else
        Set targetCell = Target.cells(1, 1)
    End If

    On Error GoTo 0

    ' targetCellがNothingの場合は処理を終了
    If targetCell Is Nothing Then Exit Sub

    topLeftCell = targetCell.Address

    ' 動的にダブルクリック対象セルを判定
    If IsTargetCell(topLeftCell) Then
        Cancel = True
        ' 結合セルの場合は結合範囲全体を渡す
        If Target.MergeCells And Not mergeArea Is Nothing Then
            Call InsertPictureToCell(mergeArea)
        Else
            Call InsertPictureToCell(Target)
        End If
    End If
End Sub

' 対象セルかどうかを動的に判定する関数
Private Function IsTargetCell(cellAddress As String) As Boolean
    Dim col As String
    Dim row As Long

    ' セルアドレスから列と行を抽出
    col = Left(Replace(cellAddress, "$", ""), 1)
    row = CLng(Mid(Replace(cellAddress, "$", ""), 2))

    ' B列またはL列でない場合は対象外
    If col <> "B" And col <> "L" Then
        IsTargetCell = False
        Exit Function
    End If

    ' 行番号のパターンをチェック
    Dim targetRows As Collection
    Set targetRows = GenerateTargetRows()

    Dim i As Long
    For i = 1 To targetRows.Count
        If targetRows(i) = row Then
            IsTargetCell = True
            Exit Function
        End If
    Next i

    IsTargetCell = False
End Function

' 対象行番号を動的に生成する関数
Private Function GenerateTargetRows() As Collection
    Dim rows As New Collection
    Dim currentRow As Long
    Dim patternIndex As Long
    Dim maxRow As Long

    ' シートの最大行を取得（使用されている範囲）
    maxRow = Me.usedRange.rows.Count + Me.usedRange.row - 1
    If maxRow < 100 Then maxRow = 200  ' 最低でも200行まではチェック

    ' 最初の行: 8行目
    currentRow = 8
    rows.Add currentRow

    ' 2番目: +12行 (18行目)
    currentRow = currentRow + 12
    If currentRow <= maxRow Then rows.Add currentRow

    ' 3番目: +12行 (30行目)
    currentRow = currentRow + 12
    If currentRow <= maxRow Then rows.Add currentRow

    ' 以降のパターン: +16行、+12行、+12行を繰り返し
    Dim pattern As Variant
    pattern = Array(16, 12, 12)  ' パターン配列
    patternIndex = 0

    Do While currentRow <= maxRow
        currentRow = currentRow + pattern(patternIndex)
        If currentRow <= maxRow Then
            rows.Add currentRow
        End If
        patternIndex = (patternIndex + 1) Mod (UBound(pattern) + 1)
    Loop

    Set GenerateTargetRows = rows
End Function

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
