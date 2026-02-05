
import { Categoria, TipoTransaccion } from "./transaction";

export interface LearningRule {
    id: string;
    user_id: string;
    patron_descripcion: string;
    categoria_destino: Categoria;
    tipo_destino: TipoTransaccion;
    created_at?: string;
    updated_at?: string;
}
