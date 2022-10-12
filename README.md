# dec-app-template

A set of standardized dec-app project templates.

## CYFS project basic compilation command

-   Execute npm run install dependencies
-   Execute npm run proto-mac to compile proto files into js files, you need to execute npm run proto-mac-pre (mac) first
-   Execute npm run proto-windows to compile proto files into js files (windows)
-   Execute npm run dev to start the local front-end service, and you can view the modification effect in real time from the `cyfs browser`
-   Run tools/zone-simulator.exe to open the simulator. Note: If you only test the same zone interface, use sim1, if you need to test the cross-zone interface, you need to open sim2.
-   execute npm run sim1 to start `sim1` running on the local emulator,
-   Execute npm run sim2 to start `sim2` running on the local emulator
-   execute npm run build to execute the build task
-   Execute npm run deploy to deploy `DEC App` to `OOD`, the user can install it, the mac system needs to execute npm run mac-deploy-pre first
-   execute npm run lint to execute eslint checks
-   execute npm run lint_fix to execute eslint autofix

## CYFS project directory structure description

-   Meta information of .cyfs project and Owner
-   cyfs.config.json is the configuration file for the Dec App project
-   service_package.cfg is the server configuration file of the Dec App project
-   move_deploy.js is the necessary file move operation before deploy
-   The deploy directory is the output directory of the project compilation, and the `cyfs` package refers to the files here
-   The dist directory is the storage directory for the front-end package files of the Dec App project
-   doc directory to store documents
-   src storage code directory

## Compile the proto file as Typescript in the mac environment

In the project root directory, execute the command as follows:

```shell
npm run proto-mac-pre
npm run proto-mac
```

**Note** Since the protoc executable program is directly executed, a pop-up window may prompt _cannot open "protoc" because the developer cannot be verified_, and the developer needs to set it according to the following path:
_System Preferences_ -> _Security & Privacy_ -> _Allow Apps Downloaded from_ -> Select _App Store and Approved Developers_ -> Click _Allow Still_
Follow this path to set it up and execute the command again.
After running, two files, obj_proto_pb.d.ts and obj_proto_pb.js, are generated in the src/common/objs folder. In the obj_proto_pb.d.ts declaration file, we see the type definition of the Order object.
