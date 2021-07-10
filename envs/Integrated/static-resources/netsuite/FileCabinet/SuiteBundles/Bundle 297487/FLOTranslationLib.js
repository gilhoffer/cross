function getUserLangPreference() {
	var lang = nlapiGetContext().getPreference('language');
	nlapiLogExecution("debug","lang ", lang);
}

function getTranslations() {
	var translations = {};
	
	var spanish_latin_america = [];
	spanish_latin_america['NOMBRE']='Name';
	spanish_latin_america['DESCRIPCIÓN']='Description';
	spanish_latin_america['DESDE PAQUETE']='From Bundle';
	spanish_latin_america['ID INTERNO']='Internal ID';
	spanish_latin_america['ÚLTIMA EJECUCIÓN EL']='Last Run On';
	spanish_latin_america['EJECUTADO POR ÚLTIMA VEZ POR']='Last Run By';
	spanish_latin_america['ACCESO']='Access';
	spanish_latin_america['PROGRAMA']='Schedule';
	
	//FIELD (GENERAL)
	spanish_latin_america['TIPO']='Type';
	spanish_latin_america['LISTA']='List';
	spanish_latin_america['FICHA']='Tab';
	
	//OTHER FIELDS
	spanish_latin_america['TIPO DE REGISTRO']='Record Type';
	spanish_latin_america['TIPO DE CAMPO']='Field Type';
	
	//ITEM FIELD
	spanish_latin_america['SUBTIPO']='SubType';
	
	//BODY FIELD
	spanish_latin_america['ORIGEN']='Source';
	
	//LIST
	spanish_latin_america['PROPIETARIO']='Owner';
	
	//CUSTOM RECORD
	spanish_latin_america['EDITAR']='Edit';

	//SCRIPTS
	spanish_latin_america['SCRIPT DE BIBLIOTECA']='Library Script';

	//MASS UPDATE
	spanish_latin_america['TÍTULO DE LA ACCIÓN']='Title of Action';

	//SCRIPT DEPLOYMENTS
	spanish_latin_america['ESTADO ']='Status';
	spanish_latin_america['TÍTULO']='Title';


	//Transaction Types
	spanish_latin_america['VENTA'] = 'Sale';
	spanish_latin_america['COMPRA'] = 'Purchase';
	spanish_latin_america['OPORTUNIDAD'] = 'Opportunity';
	spanish_latin_america['TIENDA WEB'] = 'Web Store';
	spanish_latin_america['DIARIO'] = 'Journal';
	spanish_latin_america['INFORME DE GASTOS'] = 'Expense Report';
	spanish_latin_america['ORDEN DE TRASLADO'] = 'Transfer Order';
	spanish_latin_america['RECEP. DE ARTÍCULO'] = 'Item Rcpt.';
	spanish_latin_america['INV. AJUSTES'] = 'Inv. Adjst.';
	spanish_latin_america['ORDEN DE TRABAJO / CONSTRUCCIÓN'] = 'Work Order / Build';
	spanish_latin_america['PAGO DEL CLIENTE'] = 'Customer Payment';
	spanish_latin_america['PAGO AL PROVEEDOR'] = 'Vendor Payment';
	spanish_latin_america['DEPÓSITO'] = 'Deposit';
	spanish_latin_america['VALORES POR DEFECTO DE IMPRESIÓN'] = 'Print Default';
	spanish_latin_america['COMPROBANTE DE RETIRO'] = 'Pick. Tick.';
	spanish_latin_america['DOCUMENTO DE EMBALAJE'] = 'Pack. Slip';
	spanish_latin_america['ESTADO DE CUENTA'] = 'Statement';
	spanish_latin_america['OTRO'] = 'Other';
	spanish_latin_america['PERSONALIZADO'] = 'Custom';
	spanish_latin_america['GASTO'] = 'Expense';
	spanish_latin_america['ALMACENAR'] = 'Store';
	spanish_latin_america['ORDEN DE TRABAJO'] = 'Work Order';
	spanish_latin_america['TIEMPO'] = 'Time';
	spanish_latin_america['ARTÍCULO CUMPLIMENTADO'] = 'Item Fulf.';
	spanish_latin_america['IMPRIMIR'] = 'Print'
	spanish_latin_america['ORMULARIO DE DEVOLUCIÓN'] = 'Ret. Form'
	spanish_latin_america['TODOS LOS ARTÍCULOS'] = 'All Items'

	//Entity Types
	spanish_latin_america['CLIENTE'] = 'Customer';
	spanish_latin_america['PROYECTO'] = 'Job';
	spanish_latin_america['PROVEEDOR'] = 'Vendor';
	spanish_latin_america['EMPLEADO'] = 'Employee';
	spanish_latin_america['OTRO NOMBRE'] = 'Other Name';
	spanish_latin_america['OTRO_NOMBRE'] = 'Other_Name';
	spanish_latin_america['CONTACTO'] = 'Contact';
	spanish_latin_america['SOCIO'] = 'Partner';
	spanish_latin_america['GRUPO'] = 'Group';
	spanish_latin_america['RECURSO GENÉRICO'] = 'Generic Resource';
	spanish_latin_america['PLANTILLA DEL PROYECTO'] = 'Project Template';

	//Item Types
	spanish_latin_america['ARTÍCULO DE INVENTARIO'] = 'Inventory Part';
	spanish_latin_america['PARTE FUERA DE INVENTARIO'] = 'Non-Inventory Part';
	spanish_latin_america['SERVICIO'] = 'Service';
	spanish_latin_america['OTRO CARGO'] = 'Other Charge';
	spanish_latin_america['PLAN DE SUSCRIPCIÓN'] = 'Subscription Plan';
	spanish_latin_america['KIT/PAQUETE'] = 'Kit/Package';
	spanish_latin_america['ENSAMBLAJE/LISTA DE MATERIALES'] = 'Assembly/Bill of Materials';
	spanish_latin_america['SUBTIPO'] = 'Subtype';

	//CRM Types
	spanish_latin_america['TAREA'] = 'Task';
	spanish_latin_america['TAREA DE PROYECTO'] = 'Project Task';
	spanish_latin_america['LLAMADA TELEFÓNICA'] = 'Phone Call';
	spanish_latin_america['EVENTO'] = 'Event';
	spanish_latin_america['CASO'] = 'Case';
	spanish_latin_america['CAMPAÑA'] = 'Campaign';
	spanish_latin_america['SOLUCIÓN'] = 'Solution';

	//Item Number
	spanish_latin_america['EN SERIE'] = 'Serialized';
	spanish_latin_america['LOTES'] = 'Lots';
	spanish_latin_america['CERTIFICADO DE REGALO'] = 'Gift Certificate';

	
	
	//For Spanish and Spanish Latin America
	translations['es_AR'] = spanish_latin_america;
	translations['es_ES'] = spanish_latin_america;


	
	
	
	
	return translations;
}