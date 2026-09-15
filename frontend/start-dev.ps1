$node = "c:\Users\harit\Desktop\tec-managemant\frontend\.local-node\node-v18.20.0-win-x64\node.exe"
$next = "c:\Users\harit\Desktop\tec-managemant\frontend\node_modules\next\dist\bin\next"
$env:DATABASE_URL = "file:./dev.db"
& $node $next dev -p 3002
