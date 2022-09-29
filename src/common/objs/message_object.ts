// ObjectName: Message
import * as cyfs from 'cyfs-sdk';
import { AppObjectType } from '../types';
import * as protos from './obj_proto_pb';
// The first 16 bits of type are reserved by the system, and the type of the applied object should be greater than 32767
export const MESSAGE_OBJECT_TYPE = AppObjectType.MESSAGE;

export class MessageDescTypeInfo extends cyfs.DescTypeInfo {
    public obj_type(): number {
        return MESSAGE_OBJECT_TYPE;
    }

    public sub_desc_type(): cyfs.SubDescType {
        // default
        return {
            owner_type: 'option',
            area_type: 'option',
            author_type: 'option',
            key_type: 'disable'
        };
    }
}

const MESSAGE_DESC_TYPE_INFO = new MessageDescTypeInfo();

export class MessageDescContent extends cyfs.ProtobufDescContent {
    private m_content: string;

    public constructor(content: string) {
        super();

        this.m_content = content;
    }

    public type_info(): cyfs.DescTypeInfo {
        return MESSAGE_DESC_TYPE_INFO;
    }

    public try_to_proto(): cyfs.BuckyResult<protos.Message> {
        const target = new protos.Message();
        target.setContent(this.m_content);

        return cyfs.Ok(target);
    }

    public get content(): string {
        return this.m_content;
    }
}

export class MessageDescContentDecoder extends cyfs.ProtobufDescContentDecoder<
    MessageDescContent,
    protos.Message
> {
    public constructor() {
        super(protos.Message.deserializeBinary);
    }

    public type_info(): cyfs.DescTypeInfo {
        return MESSAGE_DESC_TYPE_INFO;
    }

    public try_from_proto(messageObject: protos.Message): cyfs.BuckyResult<MessageDescContent> {
        const content = messageObject.getContent();
        return cyfs.Ok(new MessageDescContent(content));
    }
}

export class MessageDesc extends cyfs.NamedObjectDesc<MessageDescContent> {
    // default
}

export class MessageDescDecoder extends cyfs.NamedObjectDescDecoder<MessageDescContent> {
    // default
}

export class MessageBodyContent extends cyfs.ProtobufBodyContent {
    public constructor() {
        super();
    }

    public try_to_proto(): cyfs.BuckyResult<protos.NoneObject> {
        return cyfs.Ok(new protos.NoneObject());
    }
}

export class MessageBodyContentDecoder extends cyfs.ProtobufBodyContentDecoder<
    MessageBodyContent,
    protos.NoneObject
> {
    public constructor() {
        super(protos.NoneObject.deserializeBinary);
    }

    public try_from_proto(value: protos.NoneObject): cyfs.BuckyResult<MessageBodyContent> {
        return cyfs.Ok(new MessageBodyContent());
    }
}

export class MessageBuilder extends cyfs.NamedObjectBuilder<
    MessageDescContent,
    MessageBodyContent
> {
    // default
}

export class MessageId extends cyfs.NamedObjectId<MessageDescContent, MessageBodyContent> {
    public constructor(id: cyfs.ObjectId) {
        super(MESSAGE_OBJECT_TYPE, id);
    }
    // default
}

export class MessageIdDecoder extends cyfs.NamedObjectIdDecoder<
    MessageDescContent,
    MessageBodyContent
> {
    public constructor() {
        super(MESSAGE_OBJECT_TYPE);
    }
    // default
}

export class Message extends cyfs.NamedObject<MessageDescContent, MessageBodyContent> {
    public static create(param: {
        content: string;
        decId: cyfs.ObjectId;
        owner: cyfs.ObjectId;
    }): Message {
        const descContent = new MessageDescContent(param.content);
        const bodyContent = new MessageBodyContent();
        const builder = new MessageBuilder(descContent, bodyContent);
        return builder.dec_id(param.decId).owner(param.owner).build(Message);
    }

    public get content(): string {
        return this.desc().content().content;
    }
}

export class MessageDecoder extends cyfs.NamedObjectDecoder<
    MessageDescContent,
    MessageBodyContent,
    Message
> {
    public constructor() {
        super(new MessageDescContentDecoder(), new MessageBodyContentDecoder(), Message);
    }
}
