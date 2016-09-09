Set objArgs = WScript.Arguments
ZipFile = objArgs(1)
Wscript.echo ZipFile

Dim objFSO
Set objFSO = CreateObject("Scripting.FileSystemObject")

'If zip file doesn't exist create a new one
If (Not objFSO.fileExists(ZipFile)) then
	objFSO.CreateTextFile(ZipFile, True).Write ""
    End If

Dim zip
Set zip = CreateObject("Shell.Application").NameSpace(ZipFile)

Set re = New RegExp
re.Global     = True
re.IgnoreCase = False
'pattern to match the filenames
re.Pattern    = "requests\.[0-9\-]+\.log"
objStartFolder = objArgs(0)
Set objFolder = objFSO.GetFolder(objStartFolder)

Set colFiles = objFolder.Files

'iterates through all files in the folder
For Each objFile in colFiles
	If re.Test(objFile.Name) Then
	FileName = objArgs(0)+"\"+ objFile.Name
	zip.CopyHere(FileName)
	Wscript.echo FileName
    End If

  Wscript.Sleep(1000) 'value need to be changed depending the file sizes.
Next