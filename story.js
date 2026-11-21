/** Episodios de Brote Bravo. Los nombres llegan del perfil privado del jugador. */
export function storyFor(level, family = {}) {
  const name = family.name || 'amigo';
  const cat = family.cat || 'la gata';
  const dog = family.dog || 'el perrito';
  const friend = family.friend || 'tu amiga';
  const line = (speaker, text) => ({ speaker, text });
  const episodes = [
    {
      title: 'Las semillas del molinito',
      lines: [
        line('pea', `¡Hola, ${name}! Soy Guisante. ${cat} encontró un puñado de semillas que brillan. ¿Las llevamos al huerto lunar?`),
        line('sun', '¡Y yo soy Girasol! Tirá de la honda hacia atrás y soltá. ¡Salimos volando y echamos raíces donde caemos!'),
        line('pea', `${dog} ya olfateó el camino. ¡Ahí viene un espantajo! Probá un tiro suave para defender el molino.`),
      ],
    },
    {
      title: 'Un bolsillo de sol',
      lines: [
        line('sun', `${name}, guardé las semillas en un bolsillo de hojas. ${friend} camina con nosotros y cuida el molinito de papel.`),
        line('pea', 'Girasol produce energía para sumar plantas. Dale un lugar seguro, detrás de quienes defienden la fila.'),
        line('sun', 'Las casillas doradas nos dan más fuerza. Si tu semilla cae en una libre, aprovechamos mejor el suelo.'),
      ],
    },
    {
      title: 'Una voz entre el rocío',
      lines: [
        line('ice', `Soy Escarcha, ${name}. Escuché nuestras semillas sonar dentro del bolsillo. ¡Parece que tienen ganas de viajar!`),
        line('pea', `${dog} nos acompaña por el sendero. Se queda con ${friend}; nosotros cuidamos las filas.`),
        line('ice', 'Mis disparos frenan a los espantajos. Así ganamos un poquito de tiempo para pensar la próxima tirada.'),
      ],
    },
    {
      title: 'Paja con apuro',
      lines: [
        line('pea', `${name}, vienen corredores de paja. Tienen mucho apuro y poca resistencia. Mirá por qué fila llegan.`),
        line('sun', `${cat} los sigue con la mirada desde el camino. Yo prefiero seguir tu plan.`),
        line('ice', 'Podés frenarlos conmigo y sumar guisantes a esa fila. Probá; una idea se mejora mientras jugamos.'),
      ],
    },
    {
      title: 'El molinito señala el bosque',
      lines: [
        line('sun', `El molinito de papel apunta al bosque ámbar, ${name}. Ahí empieza el camino hacia la luna.`),
        line('pea', 'El viento mueve las semillas durante el vuelo. Mirá su flecha y el arco antes de soltar.'),
        line('sun', `${friend} dice que las hojas parecen manos saludando. Nos llevamos ese saludo para el viaje.`),
      ],
    },
    {
      title: 'Petabrote tiene una idea',
      lines: [
        line('bomb', `¡Acá abajo, ${name}! Soy Petabrote. Me tapó una hoja enorme. Gracias por escuchar mi voz.`),
        line('sun', 'Llegamos al bosque ámbar. Su columna brillante mejora nuestros ataques y mi energía.'),
        line('bomb', 'Yo espero cerca del peligro y exploto cuando se acerca. Alcanzo también a espantajos de las filas vecinas.'),
      ],
    },
    {
      title: 'El ruido de las corazas',
      lines: [
        line('pea', `${name}, esa paja lleva coraza. Avanza despacio, pero aguanta más golpes. Conviene preparar su fila con tiempo.`),
        line('bomb', 'Nuestras semillas siguen a salvo. ¡Qué olor a tierra mojada tiene este bosque!'),
        line('ice', 'Yo puedo frenar las corazas mientras Guisante dispara. Cada planta aporta algo distinto.'),
      ],
    },
    {
      title: 'Una película entre hojas',
      lines: [
        line('sun', `${cat} se acomodó junto a ${dog}. Este bosque parece una película animada, ${name}. ¡Y nosotros tenemos diálogo!`),
        line('pea', 'Yo pediría una escena con muchas semillas y pocos espantajos. Pero podemos resolver esta juntos.'),
        line('sun', 'Si una semilla pasa de largo, probá tensar un poquito menos en el próximo tiro.'),
      ],
    },
    {
      title: 'Escudos en el sendero',
      lines: [
        line('ice', `${name}, aparecen escudos. Los guisantes pierden fuerza contra ellos; mis disparos los atraviesan.`),
        line('bomb', 'Mi explosión también pasa los escudos. Si llegan juntos, puedo abrir un espacio para las demás plantas.'),
        line('pea', `${friend} ajustó el bolsillo de semillas. Nosotros ajustamos el plan. Eso también es ser valientes.`),
      ],
    },
    {
      title: 'El guardián del puente verde',
      lines: [
        line('sun', `El Gran Espantajo bloquea el puente, ${name}. Del otro lado se ve el valle nevado.`),
        line('ice', 'Llegará en la última oleada. Conservá energía y prepará su fila; tiene mucha más resistencia.'),
        line('pea', 'No hace falta apurarse. Respirá, mirá el viento y elegí. El bolsillo de semillas va con nosotros.'),
      ],
    },
    {
      title: 'Espinas bajo la nieve',
      lines: [
        line('thorn', `Bienvenido al valle nevado, ${name}. Soy Cactus. Tengo espinas, pero para charlar soy bastante suave.`),
        line('sun', 'Cruzamos el puente y seguimos todos juntos. El molinito de papel gira hasta con este frío.'),
        line('thorn', 'La franja de nieve frena enemigos. Mis espinas atraviesan hasta tres que vengan en la misma fila.'),
      ],
    },
    {
      title: 'Pies firmes, hojas tranquilas',
      lines: [
        line('ice', `${name}, pensá en taekwondo: equilibrio, atención y respirar. Acá tu mejor movimiento puede ser una tirada tranquila.`),
        line('thorn', `${dog} dejó huellitas junto al camino. ${cat} eligió caminar por donde hay menos nieve.`),
        line('pea', 'Cada uno encuentra su manera. Vos podés combinar nuestras plantas y descubrir la tuya.'),
      ],
    },
    {
      title: 'El hilo del remendón',
      lines: [
        line('thorn', `${name}, ese espantajo lleva hilo. Es el Remendón: cura a los enemigos cercanos.`),
        line('ice', 'Si se juntan muchos, Petabrote alcanza varias filas. Elegí una casilla libre cerca de su paso.'),
        line('sun', `${friend} encontró una pluma en la nieve. La guardó junto al molinito: nuestro pequeño recuerdo del valle.`),
      ],
    },
    {
      title: 'El calor de una idea',
      lines: [
        line('pea', `${name}, el huerto lunar brilla detrás de las montañas. Ya se ve desde acá.`),
        line('sun', `${cat} y ${dog} esperan con ${friend} al reparo. Las semillas van abrigadas entre mis hojas.`),
        line('thorn', 'Si una tirada sale distinta, mirá qué pasó. Cambiar la tensión un poquito puede ayudarte en la próxima.'),
      ],
    },
    {
      title: 'La gran coraza del paso',
      lines: [
        line('thorn', `Otro Gran Espantajo guarda el paso, ${name}. Trae una coraza enorme y viene en la última oleada.`),
        line('ice', 'La nieve y mis disparos pueden frenarlo juntos. Ese tiempo nos sirve para sostener la defensa.'),
        line('sun', 'El molinito apunta hacia arriba. Un esfuerzo más y veremos el huerto bajo todas las estrellas.'),
      ],
    },
    {
      title: 'Micelio escucha la luna',
      lines: [
        line('spore', `Soy Micelio, ${name}. El suelo me contó que venías con semillas. Bienvenido al huerto lunar.`),
        line('sun', 'Dejamos atrás el valle. Acá la luna nos entrega energía de a ratitos, mientras defendemos el huerto.'),
        line('spore', 'Mis esporas alcanzan grupos y atraviesan escudos. Después siguen haciendo daño durante un ratito.'),
      ],
    },
    {
      title: 'Un equipo sin control',
      lines: [
        line('pea', `${name}, esto me recuerda cuando armás un equipo en Xbox. Solo que yo todavía no encontré mi botón de salto.`),
        line('spore', 'Yo tampoco salto mucho. Pero mis esporas y las espinas de Cactus pueden ayudar en las filas llenas.'),
        line('sun', `${friend} nos escucha sonriendo. Las semillas ya están en casa; ahora tenemos que cuidarla.`),
      ],
    },
    {
      title: 'El viento entre las estrellas',
      lines: [
        line('spore', `${name}, hasta el huerto lunar tiene viento. Mirá la flecha: la semilla puede desviarse mientras vuela.`),
        line('bomb', 'Y buscá una casilla vacía. Si caemos donde ya crece otra planta, no podemos echar raíces.'),
        line('pea', `${cat} mira el molinito. ${dog} mira a ${cat}. Yo miro tu próxima idea.`),
      ],
    },
    {
      title: 'El bolsillo se abre',
      lines: [
        line('sun', `${name}, abrimos el bolsillo: siguen todas las semillas. Cada una lleva un pedacito del camino.`),
        line('thorn', 'Todavía llega paja. Repartí la defensa entre las filas que la necesiten; una fila tranquila puede esperar.'),
        line('spore', `${friend} sostiene el molinito bien alto. Cuando este huerto esté seguro, el viaje habrá valido cada paso.`),
      ],
    },
    {
      title: 'El corazón del jardín',
      lines: [
        line('pea', `${name}, viene el último Gran Espantajo. Quiere el corazón del jardín, donde crecerán nuestras semillas.`),
        line('spore', 'Prepará las filas antes de la última oleada. Tenemos frío, espinas, explosiones y tus ideas para defenderlas.'),
        line('sun', 'Cuando pase, sembraré nuestro bolsillo entero. Un jardín empieza así: alguien cuida algo pequeño y se queda a su lado.'),
      ],
    },
    {
      title: 'Un brote para cada amigo',
      lines: [
        line('sun', `Lo logramos, ${name}. Las semillas ya brotaron. El huerto lunar tiene nuevos colores y el molinito volvió a girar.`),
        line('pea', `${cat}, ${dog} y ${friend} descansan junto al jardín. Nosotros nos quedamos charlando entre las hojas.`),
        line('spore', 'Tu mejor idea fue cuidarnos juntos. Cuando vuelvas, habrá un lugar a la sombra y muchas historias para contarte.'),
      ],
    },
  ];
  const index = Math.max(0, Math.min(20, Math.floor(Number(level) || 1) - 1));
  return episodes[index];
}
