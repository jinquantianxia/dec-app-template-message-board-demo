# object definition

See `src/common/objs/demo_obj_proto.proto`

# storage structure

```
|--messages_list
|   |--message1.key => Message object
|   |--message2.key => Message object
|--comments_list
|   |--message1 # message1.key
|       |--comment1.key => Comment object
|       |--comment2.key => Comment object
```
