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
    private m_msgId: cyfs.ObjectId;
    private m_type: protos.CommentTypeMap[keyof protos.CommentTypeMap];
    private m_content: string;
    private m_ref?: cyfs.ObjectId;

    public constructor(param: {
        msgId: cyfs.ObjectId;
        type: protos.CommentTypeMap[keyof protos.CommentTypeMap];
        content: string;
        ref?: cyfs.ObjectId;
    }) {
        super();
        this.m_msgId = param.msgId;
        this.m_type = param.type;
        this.m_content = param.content;
        this.m_ref = param.ref;
    }

    public type_info(): cyfs.DescTypeInfo {
        return COMMENT_DESC_TYPE_INFO;
    }

    public try_to_proto(): cyfs.BuckyResult<protos.Comment> {
        const target = new protos.Comment();
        target.setMsgid(cyfs.ProtobufCodecHelper.encode_buf(this.m_msgId).unwrap());
        target.setType(this.m_type);
        target.setContent(this.m_content);
        if (this.m_ref) target.setRef(cyfs.ProtobufCodecHelper.encode_buf(this.m_ref).unwrap());
        return cyfs.Ok(target);
    }

    public get msgId(): cyfs.ObjectId {
        return this.m_msgId;
    }

    public get type(): protos.CommentTypeMap[keyof protos.CommentTypeMap] {
        return this.m_type;
    }

    public get content(): string {
        return this.m_content;
    }

    public get ref(): cyfs.ObjectId | undefined {
        return this.m_ref;
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
        const msgId = checkObjectId(commentObject.getMsgid_asU8());
        if (!msgId) {
            const msg = `CommentDescContentDecoder decode failed for objectId.len=${
                commentObject.getMsgid_asU8().length
            }`;
            console.error(msg);
            return makeBuckyErr(cyfs.BuckyErrorCode.CodeError, msg);
        }
        const type = commentObject.getType();
        const content = commentObject.getContent();
        const ref = commentObject.hasRef() ? checkObjectId(commentObject.getRef_asU8()) : undefined;
        return cyfs.Ok(new CommentDescContent({ msgId, type, content, ref }));
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

export class CommentBuilder extends cyfs.NamedObjectBuilder<
    CommentDescContent,
    CommentBodyContent
> {
    // default
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

export class Comment extends cyfs.NamedObject<CommentDescContent, CommentBodyContent> {
    public static create(param: {
        msgId: cyfs.ObjectId;
        type: protos.CommentTypeMap[keyof protos.CommentTypeMap];
        content: string;
        ref?: cyfs.ObjectId;
        decId: cyfs.ObjectId;
        owner: cyfs.ObjectId;
    }): Comment {
        const { msgId, type, content, ref } = param;
        const descContent = new CommentDescContent({ msgId, type, content, ref });
        const bodyContent = new CommentBodyContent();
        const builder = new CommentBuilder(descContent, bodyContent);
        return builder.dec_id(param.decId).owner(param.owner).build(Comment);
    }
    public get msgId(): cyfs.ObjectId {
        return this.desc().content().msgId;
    }

    public get type(): protos.CommentTypeMap[keyof protos.CommentTypeMap] {
        return this.desc().content().type;
    }

    public get content(): string {
        return this.desc().content().content;
    }

    public get ref(): cyfs.ObjectId | undefined {
        return this.desc().content().ref;
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
