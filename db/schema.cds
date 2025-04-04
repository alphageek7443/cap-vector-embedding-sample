namespace cap.vector.embedding;

using {managed} from '@sap/cds/common';

entity Books : managed {
    key ID        : Integer;
        title     : String(111) @mandatory;
        descr     : String(5000);
        embedding : Vector = VECTOR_EMBEDDING(
            descr, 'DOCUMENT', 'SAP_NEB.20240715'
        ) stored;
        embedding_openai : Vector;
}
