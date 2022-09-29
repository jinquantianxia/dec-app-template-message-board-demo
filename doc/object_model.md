# object definition

See `src/common/objs/demo_obj_proto.proto`

# storage structure

```
|--messages_list
|   |--message1.object_id => Message object
|   |--message2.object_id => Message object
|--comments_list
|   |--message1 # message1.object_id
|       |--comment1.object_id => Comment object
|       |--comment2.object_id => Comment object
```
