// ObjectName: Comment
import * as cyfs from 'cyfs-sdk';
import { AppObjectType } from '../types';
import * as protos from './obj_proto_pb';
import { checkObjectId, makeBuckyErr } from '../cyfs_helper/kits';
// The first 16 bits of type are reserved by the system, and the type of the applied object should be greater than 32767
export const COMMENT_OBJECT_TYPE = AppObjectType.COMMENT;

export class CommentDescTypeInfo extends cyfs.DescTypeInfo {
    public obj_type(): number {
        return COMMENT_OBJECT_TYPE;
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

const COMMENT_DESC_TYPE_INFO = new CommentDescTypeInfo();

export class CommentDescContent extends cyfs.ProtobufDescContent {
    private m_key: string;
    private m_msgId: string;
    private m_content: string;

    public constructor(param: { key: string; msgId: string; content: string }) {
        super();
        this.m_key = param.key;
        this.m_msgId = param.msgId;
        this.m_content = param.content;
    }

    public type_info(): cyfs.DescTypeInfo {
        return COMMENT_DESC_TYPE_INFO;
    }

    public try_to_proto(): cyfs.BuckyResult<protos.Comment> {
        const target = new protos.Comment();
        target.setKey(this.m_key);
        target.setMsgid(this.m_msgId);
        target.setContent(this.m_content);

        return cyfs.Ok(target);
    }

    public get key(): string {
        return this.m_key;
    }

    public get msgId(): string {
        return this.m_msgId;
    }

    public get content(): string {
        return this.m_content;
    }
}

export class CommentDescContentDecoder extends cyfs.ProtobufDescContentDecoder<
    CommentDescContent,
    protos.Comment
> {
    public constructor() {
        super(protos.Comment.deserializeBinary);
    }

    public type_info(): cyfs.DescTypeInfo {
        return COMMENT_DESC_TYPE_INFO;
    }

    public try_from_proto(commentObject: protos.Comment): cyfs.BuckyResult<CommentDescContent> {
        const key = commentObject.getKey();
        const msgId = commentObject.getMsgid();

        const content = commentObject.getContent();

        return cyfs.Ok(new CommentDescContent({ key, msgId, content }));
    }
}

export class CommentDesc extends cyfs.NamedObjectDesc<CommentDescContent> {
    // default
}

export class CommentDescDecoder extends cyfs.NamedObjectDescDecoder<CommentDescContent> {
    // default
}

export class CommentBodyContent extends cyfs.ProtobufBodyContent {
    public constructor() {
        super();
    }

    public try_to_proto(): cyfs.BuckyResult<protos.NoneObject> {
        return cyfs.Ok(new protos.NoneObject());
    }
}

export class CommentBodyContentDecoder extends cyfs.ProtobufBodyContentDecoder<
    CommentBodyContent,
    protos.NoneObject
> {
    public constructor() {
        super(protos.NoneObject.deserializeBinary);
    }

    public try_from_proto(value: protos.NoneObject): cyfs.BuckyResult<CommentBodyContent> {
        return cyfs.Ok(new CommentBodyContent());
    }
}

export class CommentId extends cyfs.NamedObjectId<CommentDescContent, CommentBodyContent> {
    public constructor(id: cyfs.ObjectId) {
        super(COMMENT_OBJECT_TYPE, id);
    }
    // default
}

export class CommentIdDecoder extends cyfs.NamedObjectIdDecoder<
    CommentDescContent,
    CommentBodyContent
> {
    public constructor() {
        super(COMMENT_OBJECT_TYPE);
    }
    // default
}

export class CommentBuilder extends cyfs.NamedObjectBuilder<
    CommentDescContent,
    CommentBodyContent
> {
    // default
}

export class Comment extends cyfs.NamedObject<CommentDescContent, CommentBodyContent> {
    public static create(param: {
        key: string;
        msgId: string;
        content: string;
        decId: cyfs.ObjectId;
        owner: cyfs.ObjectId;
    }): Comment {
        const { key, msgId, content } = param;
        const descContent = new CommentDescContent({ key, msgId, content });
        const bodyContent = new CommentBodyContent();
        const builder = new CommentBuilder(descContent, bodyContent);
        return builder.dec_id(param.decId).owner(param.owner).build(Comment);
    }

    public get key(): string {
        return this.desc().content().key;
    }

    public get msgId(): string {
        return this.desc().content().msgId;
    }

    public get content(): string {
        return this.desc().content().content;
    }
}

export class CommentDecoder extends cyfs.NamedObjectDecoder<
    CommentDescContent,
    CommentBodyContent,
    Comment
> {
    public constructor() {
        super(new CommentDescContentDecoder(), new CommentBodyContentDecoder(), Comment);
    }
}
