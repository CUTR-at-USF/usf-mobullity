
WScript.Echo("Monthly request log rotation started...");

var fso = WScript.CreateObject("Scripting.FileSystemObject");
var file = fso.GetFile("requests.zip");

WScript.Echo(file.Name);

var today = new Date();
var dateStr = today.getMonth()+1 + "." + today.getDate() + "." + today.getYear();

var wshShell = WScript.CreateObject( "WScript.Shell" );
var strComputerName = wshShell.ExpandEnvironmentStrings( "%COMPUTERNAME%" ).toLowerCase();

var newFilename = "P:\\CUTR\\TDM Team-USF Maps App Archive\\" + strComputerName + "-requests." + dateStr + ".zip";
WScript.Echo(newFilename);

file.Move( newFilename );

