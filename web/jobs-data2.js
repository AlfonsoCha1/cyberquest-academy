/* ===== Vacantes reales para prepararse (resumen propio de lo publicado) ===== */
const JOBS = [
  {
    id: 'engie-2026-68245',
    titulo: 'Especialista Sr. de Ciberseguridad (IT & AI Security)',
    empresa: 'ENGIE México', lugar: 'Ciudad de México', area: 'Digital / IT / Datos',
    sueldo: '$38,000 a $46,000 MXN al mes (rango publicado)', contrato: 'Permanente, tiempo completo',
    publicada: '2 de octubre de 2026',
    url: 'https://jobs.engie.com/job/Especialista-en-Ciberseguridad/68245-es_MX/',
    mision: 'Proteger los activos digitales operando controles de ciberseguridad en TI corporativa, detectar y responder a amenazas, llevar prácticas seguras a la nube y a la IA, y explicar los riesgos en términos de negocio.',
    responsabilidades: [
      ['Monitorear eventos con SIEM y EDR y llevar el ciclo de incidentes de la detección al seguimiento.', ['siem', 'edr', 'ir']],
      ['Asegurar la configuración segura (hardening) de plataformas y servicios de TI.', ['hardening']],
      ['Coordinar la gestión de vulnerabilidades y priorizar la remediación por riesgo.', ['vuln']],
      ['Evaluar los riesgos del uso de herramientas de IA y promover controles para adoptarlas de forma segura.', ['ia']],
      ['Alinear con las políticas corporativas de ciberseguridad y apoyar auditorías y evaluaciones de riesgo.', ['grc']]
    ],
    tecnicos: [['Seguridad en entornos de TI corporativos', ['hardening', 'redes']], ['Monitoreo y respuesta a incidentes con SIEM y EDR', ['siem', 'edr', 'ir']], ['Gestión de vulnerabilidades', ['vuln']], ['Seguridad en Microsoft 365', ['m365']], ['IAM (identidades y accesos)', ['iam']], ['Zero Trust', ['zt']], ['Protección de datos con DLP', ['dlp']], ['Riesgos del uso de IA', ['ia']], ['Seguridad de aplicaciones SaaS y nube', ['cloud']], ['Gestión de la superficie de ataque', ['asm']]],
    perfil: 'Ingeniería o licenciatura en Sistemas Computacionales, Informática o afín. Mínimo 3 años en un puesto igual y 5 años de experiencia laboral total.',
    competencias: ['Ejecución y orientación a resultados', 'Comunicación efectiva', 'Trabajo en equipo y colaboración entre áreas', 'Análisis y priorización', 'Adaptabilidad', 'Aprendizaje rápido', 'Organización y seguimiento'],
    nota: 'La publicación no menciona certificaciones, marcos (ISO 27001, NIST) ni idiomas. En empresas globales el inglés suele usarse en el día a día: conviene practicar la entrevista también en inglés.',
    ruta: [
      ['Simulador SOC: todos los casos', 'soc', 'Es lo que harás a diario: triage y respuesta.'],
      ['Terminal Windows con PowerShell: los 8 retos', 'terminal', 'Investigar un equipo como lo harías con un EDR.'],
      ['Bases de datos: retos de investigación', 'sql', 'Consultas tipo SIEM: fuerza bruta, viaje imposible, prioridad de parches.'],
      ['Temas de la vacante: EDR, Microsoft 365, DLP, IA, superficie de ataque, SaaS y vulnerabilidades por riesgo', 'temas', 'Lo que la vacante pide y no venía en la academia.'],
      ['Security+: dominios 2 (amenazas) y 4 (operaciones)', 'secplus', 'Base teórica de todo lo anterior.'],
      ['Ramas: Identidades y accesos, Cloud Security y GRC', 'ramas', 'IAM, Zero Trust, auditorías y riesgo.'],
      ['Laboratorio de redes: misión de la DMZ', 'redes', 'Segmentación y exposición a Internet.'],
      ['Preguntas de entrevista de esta vacante', 'entrevista', 'Practica en voz alta, en español y en inglés.']
    ],
    extra: [
      ['Te piden 3 años en el puesto y tienes menos. ¿Cómo lo respondes?', 'Soy honesto con mis años, pero muestro lo que ya hago a ese nivel: laboratorios de SOC, investigación de logs, gestión de vulnerabilidades y proyectos propios documentados, más mi experiencia relacionada en soporte, redes o TI. Y explico qué aprendería primero en el puesto.'],
      ['¿Por qué ciberseguridad en una empresa de energía?', 'Porque la energía es infraestructura crítica: un incidente no solo afecta datos, también la operación. Me interesa proteger servicios que la gente usa todos los días y aprender de un entorno global.']
    ],
    quiz: [
      ['Una alerta del EDR indica que Word lanzó PowerShell con un comando codificado. ¿Qué haces primero?', ['Revisar el árbol de procesos y, si es malicioso, aislar el equipo', 'Ignorarla porque Word es confiable', 'Reiniciar el servidor de correo', 'Desinstalar Office en toda la empresa'], 'Validar y contener rápido: aislar conserva la evidencia.'],
      ['¿Qué combinación prioriza mejor una vulnerabilidad?', ['Explotación activa (KEV), probabilidad (EPSS), exposición y criticidad del activo', 'Solo el CVSS', 'El orden alfabético del CVE', 'La fecha de publicación'], 'Enfoque basado en riesgo, como pide la vacante.'],
      ['En Microsoft 365, ¿qué reduce más el riesgo de robo de cuentas?', ['MFA con acceso condicional y bloqueo de autenticación heredada', 'Cambiar el logo del tenant', 'Más espacio en OneDrive', 'Desactivar Teams'], 'Es lo primero que revisa cualquier auditoría de M365.'],
      ['Un empleado pegó una base de clientes en un chatbot público. ¿Qué control lo habría evitado?', ['DLP en sitios de IA y una política con herramientas aprobadas', 'Un firewall de red interna', 'Cambiar su contraseña', 'Un antivirus'], 'La fuga ocurre por el navegador: DLP y política.'],
      ['¿Qué principio NO es de Zero Trust?', ['Confiar en todo lo que está dentro de la red', 'Verificar explícitamente', 'Mínimo privilegio', 'Asumir brecha'], 'Zero Trust elimina la confianza por ubicación.'],
      ['¿Qué herramienta te ayuda a descubrir subdominios expuestos de la empresa?', ['Registros de transparencia de certificados (crt.sh)', 'Excel', 'El visor de eventos', 'Un DLP'], 'Parte de la gestión de superficie de ataque.'],
      ['Antes de aprobar una app SaaS para Finanzas, pides…', ['Reporte SOC 2 tipo II o ISO 27001, SSO/MFA y manejo de datos', 'El color de la interfaz', 'Solo el precio', 'Nada, el proveedor se encarga'], 'La responsabilidad es compartida.'],
      ['¿Qué significa "traducir un riesgo cibernético a impacto de negocio"?', ['Explicarlo en dinero, operación y reputación', 'Traducirlo al inglés', 'Ponerle un CVE', 'Mandarlo al proveedor'], 'Así la dirección puede decidir.'],
      ['¿Qué evento de Windows indica que agregaron una cuenta a un grupo privilegiado?', ['4732', '4624', '4625', '4634'], '4732 = miembro agregado a un grupo de seguridad local.'],
      ['Hardening de un servidor empieza por…', ['Una guía como CIS Benchmarks: quitar lo que no se usa y aplicar línea base', 'Instalar más programas', 'Abrir todos los puertos para probar', 'Desactivar los logs'], 'Menos superficie, configuración documentada.']
    ]
  }
];
