// ============================================================
//  seedAnimes50.js — Siembra de +50 Animes Nuevos en Catálogo
// ============================================================
// Inserta más de 50 series emblemáticas y reconocidas con
// datos oficiales, portadas reales en alta resolución y géneros.
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { conectarDB } from './config/db.js';
import { Anime } from './models/Anime.js';
import { Genero } from './models/Genero.js';
import { Usuario } from './models/Usuario.js';
import { Seguimiento } from './models/Seguimiento.js';
import { Resena } from './models/Resena.js';

dotenv.config();

const LISTA_55_ANIMES = [
  {
    titulo: 'Bleach',
    tituloOriginal: 'BLEACH',
    sinopsis: 'Ichigo Kurosaki obtiene los poderes de una Shinigami (Segadora de Almas) y asume el deber de proteger a los inocentes y guiar a los espíritus errantes.',
    generos: ['Acción', 'Aventura', 'Sobrenatural', 'Shounen'],
    totalEpisodios: 366,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
    anioEstreno: 2004,
  },
  {
    titulo: 'Bleach: Thousand-Year Blood War',
    tituloOriginal: 'BLEACH 千年血戦篇',
    sinopsis: 'La paz de la Sociedad de Almas se quiebra cuando el rey de los Quincy declara una guerra sangrienta para aniquilar el equilibrio del mundo.',
    generos: ['Acción', 'Aventura', 'Sobrenatural', 'Shounen'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Dragon Ball Z',
    tituloOriginal: 'ドラゴンボールZ',
    sinopsis: 'Goku descubre su origen como guerrero saiyajin y defiende la Tierra de temibles villanos galácticos como Vegeta, Freezer, Cell y Majin Buu.',
    generos: ['Acción', 'Aventura', 'Fantasía', 'Shounen'],
    totalEpisodios: 291,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1607/117271.jpg',
    anioEstreno: 1989,
  },
  {
    titulo: 'Neon Genesis Evangelion',
    tituloOriginal: '新世紀エヴァンゲリオン',
    sinopsis: 'En un mundo post-apocalíptico, Shinji Ikari es reclutado por su distante padre para pilotar un robot biomecánico EVA y combatir a misteriosos Ángeles.',
    generos: ['Acción', 'Ciencia Ficción', 'Drama', 'Psicológico'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1314/108941.jpg',
    anioEstreno: 1995,
  },
  {
    titulo: 'Code Geass: Lelouch of the Rebellion',
    tituloOriginal: 'コードギアス 反逆のルルーシュ',
    sinopsis: 'El príncipe exiliado Lelouch vi Britannia obtiene el poder del Geass y lidera una revolución armada contra el tiránico Sacro Imperio de Britannia.',
    generos: ['Acción', 'Drama', 'Ciencia Ficción'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/4/9391.jpg',
    anioEstreno: 2006,
  },
  {
    titulo: 'Code Geass: Lelouch of the Rebellion R2',
    tituloOriginal: 'コードギアス 反逆のルルーシュ R2',
    sinopsis: 'Lelouch recupera sus recuerdos perdidos y desata la fase definitiva de su plan maestro para destruir la injusticia global con el Zero Requiem.',
    generos: ['Acción', 'Drama', 'Ciencia Ficción'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1097/9392.jpg',
    anioEstreno: 2008,
  },
  {
    titulo: 'Tengen Toppa Gurren Lagann',
    tituloOriginal: '天元突破グレンラガン',
    sinopsis: 'Simon y Kamina escapan de su aldea subterránea para perforar los cielos pilotando el mecha Gurren Lagann contra las fuerzas de los Hombres Bestia.',
    generos: ['Acción', 'Aventura', 'Ciencia Ficción'],
    totalEpisodios: 27,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/4/5123.jpg',
    anioEstreno: 2007,
  },
  {
    titulo: 'Clannad',
    tituloOriginal: 'CLANNAD',
    sinopsis: 'Tomoya Okazaki es un estudiante desencantado de la vida que conoce a Nagisa Furukawa, ayudándola a reabrir el club de teatro mientras conoce personas entrañables.',
    generos: ['Drama', 'Romance', 'Sobrenatural'],
    totalEpisodios: 23,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1804/95033.jpg',
    anioEstreno: 2007,
  },
  {
    titulo: 'Clannad: After Story',
    tituloOriginal: 'CLANNAD 〜AFTER STORY〜',
    sinopsis: 'La continuación de Clannad sigue a Tomoya y Nagisa en su transición a la vida adulta, la paternidad y las conmovedoras pruebas del destino.',
    generos: ['Drama', 'Romance', 'Sobrenatural'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1299/110774.jpg',
    anioEstreno: 2008,
  },
  {
    titulo: 'Toradora!',
    tituloOriginal: 'とらドラ！',
    sinopsis: 'Ryuuji Takasu y Taiga Aisaka se alían para ayudarse mutuamente a conquistar a sus respectivos mejores amigos, desarrollando un vínculo inesperado.',
    generos: ['Comedia', 'Romance', 'Drama'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/13/22128.jpg',
    anioEstreno: 2008,
  },
  {
    titulo: 'Haikyuu!!',
    tituloOriginal: 'ハイキュー!!',
    sinopsis: 'Shoyo Hinata sueña con ser una leyenda del voleibol a pesar de su baja estatura, formando una dupla letal con el prodigioso armador Tobio Kageyama.',
    generos: ['Deportes', 'Comedia', 'Shounen'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/7/76014.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Kuroko no Basket',
    tituloOriginal: '黒子のバスケ',
    sinopsis: 'Tetsuya Kuroko, el sexto jugador fantasma de la Generación de los Milagros, se une a Kagami Taiga en Seirin para llegar a la cima del básquet juvenil.',
    generos: ['Deportes', 'Comedia', 'Shounen'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/11/50453.jpg',
    anioEstreno: 2012,
  },
  {
    titulo: 'Slam Dunk',
    tituloOriginal: 'スラムダンク',
    sinopsis: 'Hanamichi Sakuragi es un pandillero de preparatoria que ingresa al equipo de básquet de Shohoku por amor a una chica, descubriendo su verdadera pasión.',
    generos: ['Deportes', 'Comedia', 'Shounen'],
    totalEpisodios: 101,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/12/86890.jpg',
    anioEstreno: 1993,
  },
  {
    titulo: 'Your Lie in April',
    tituloOriginal: '四月は君の嘘',
    sinopsis: 'Kousei Arima, un prodigioso pianista que perdió la capacidad de escuchar el sonido de su música tras un trauma, conoce a la apasionada violinista Kaori Miyazono.',
    generos: ['Drama', 'Música', 'Romance'],
    totalEpisodios: 22,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/3/67177.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Kaguya-sama: Love is War',
    tituloOriginal: 'かぐや様は告らせたい～天才たちの恋愛頭脳戦～',
    sinopsis: 'Dos genios del prestigioso consejo estudiantil están profundamente enamorados, pero su orgullo desata una guerra psicológica para obligar al otro a confesarse.',
    generos: ['Comedia', 'Romance', 'Psicológico'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/3/95788.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Kaguya-sama: Love is War - Ultra Romantic',
    tituloOriginal: 'かぐや様は告らせたい-ウルトラロマンティック-',
    sinopsis: 'Durante el esperado festival cultural de la academia Shuchiin, la batalla de intelectos entre Kaguya y Miyuki alcanza su punto más alto y romántico.',
    generos: ['Comedia', 'Romance', 'Psicológico'],
    totalEpisodios: 13,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1160/122627.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'Violet Evergarden',
    tituloOriginal: 'ヴァイオレット・エヴァーガーデン',
    sinopsis: 'Violet, una ex-soldado huérfana educada únicamente para la guerra, trabaja como redactora de cartas para comprender el significado de las palabras "Te amo".',
    generos: ['Drama', 'Fantasía'],
    totalEpisodios: 13,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1795/95088.jpg',
    anioEstreno: 2018,
  },
  {
    titulo: 'Made in Abyss',
    tituloOriginal: 'メイドインアビス',
    sinopsis: 'Riko y el robot Reg descienden a las peligrosas profundidades del Abismo, un foso colosal repleto de criaturas místicas y reliquias antiguas.',
    generos: ['Aventura', 'Drama', 'Fantasía', 'Misterio'],
    totalEpisodios: 13,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/6/86733.jpg',
    anioEstreno: 2017,
  },
  {
    titulo: 'Re:Zero - Starting Life in Another World',
    tituloOriginal: 'Re:ゼロから始める異世界生活',
    sinopsis: 'Subaru Natsuki es transportado a un mundo de fantasía donde descubre que cada vez que muere, el tiempo retrocede a un punto de control en el pasado.',
    generos: ['Drama', 'Fantasía', 'Suspenso'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1522/128086.jpg',
    anioEstreno: 2016,
  },
  {
    titulo: 'Mushoku Tensei: Jobless Reincarnation',
    tituloOriginal: '無職転生 ～異世界行ったら本気だす～',
    sinopsis: 'Un desempleado solitario de 34 años reencarna como un bebé con talento mágico en un mundo de espadas y hechicería, jurando vivir su vida al máximo.',
    generos: ['Aventura', 'Drama', 'Fantasía'],
    totalEpisodios: 23,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1530/117776.jpg',
    anioEstreno: 2021,
  },
  {
    titulo: 'KonoSuba: God Blessing on this Wonderful World!',
    tituloOriginal: 'この素晴らしい世界に祝福を！',
    sinopsis: 'Kazuma Satou muere de forma ridícula y es reencarnado junto a una diosa incompetente, una maga fanática de las explosiones y una paladín masoquista.',
    generos: ['Aventura', 'Comedia', 'Fantasía'],
    totalEpisodios: 20,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/8/77838.jpg',
    anioEstreno: 2016,
  },
  {
    titulo: 'Overlord',
    tituloOriginal: 'オーバーロード',
    sinopsis: 'Un jugador queda atrapado como el poderoso mago no-muerto Ainz Ooal Gown en el cierre de un MMORPG, decidiendo conquistar el nuevo mundo desconocido.',
    generos: ['Acción', 'Aventura', 'Fantasía'],
    totalEpisodios: 13,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/7/74653.jpg',
    anioEstreno: 2015,
  },
  {
    titulo: 'No Game No Life',
    tituloOriginal: 'ノーゲーム・ノーライフ',
    sinopsis: 'Los hermanos gamers invictos Sora y Shiro son convocados al mundo de Disboard, donde todos los conflictos y fronteras se resuelven mediante juegos.',
    generos: ['Comedia', 'Fantasía', 'Sobrenatural'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1074/111944.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Sword Art Online',
    tituloOriginal: 'ソードアート・オンライン',
    sinopsis: 'Miles de jugadores quedan atrapados en un juego de realidad virtual donde la muerte en el juego significa la muerte en la vida real. Kirito lucha por escapar.',
    generos: ['Acción', 'Aventura', 'Fantasía', 'Romance'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/11/39717.jpg',
    anioEstreno: 2012,
  },
  {
    titulo: 'Tokyo Ghoul',
    tituloOriginal: '東京喰種トーキョーグール',
    sinopsis: 'Ken Kaneki se transforma en un híbrido mitad humano y mitad ghoul tras una operación de emergencia, debiendo sobrevivir entre dos mundos enemigos.',
    generos: ['Acción', 'Drama', 'Sobrenatural', 'Misterio'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1498/134443.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Psycho-Pass',
    tituloOriginal: 'PSYCHO-PASS サイコパス',
    sinopsis: 'En un Japón futurista gobernado por el Sistema Sibyl, los inspectores y ejecutores miden el estado mental y el coeficiente criminal de los ciudadanos.',
    generos: ['Acción', 'Ciencia Ficción', 'Psicológico', 'Misterio'],
    totalEpisodios: 22,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/5/43399.jpg',
    anioEstreno: 2012,
  },
  {
    titulo: 'Fate/Zero',
    tituloOriginal: 'Fate/Zero',
    sinopsis: 'Siete magos invocan a espíritus heroicos legendarios para competir en la brutal Cuarta Guerra del Santo Grial en Fuyuki.',
    generos: ['Acción', 'Fantasía', 'Sobrenatural'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/2/73249.jpg',
    anioEstreno: 2011,
  },
  {
    titulo: 'Fate/stay night: Unlimited Blade Works',
    tituloOriginal: 'Fate/stay night [Unlimited Blade Works]',
    sinopsis: 'Shirou Emiya y Rin Tohsaka unen fuerzas con sus espíritus Saber y Archer para sobrevivir a la Quinta Guerra del Santo Grial.',
    generos: ['Acción', 'Fantasía', 'Sobrenatural'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/12/73255.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Parasyte -the maxim-',
    tituloOriginal: '寄生獣 セイの格率',
    sinopsis: 'Shinichi Izumi sobrevive a la invasión de un parásito alienígena que toma el control de su mano derecha, obligándolos a cooperar para no ser devorados.',
    generos: ['Acción', 'Ciencia Ficción', 'Drama', 'Psicológico'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/3/73178.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Vinland Saga Season 2',
    tituloOriginal: 'ヴィンランド・サガ SEASON 2',
    sinopsis: 'Thorfinn trabaja como esclavo en una granja danesa, enfrentando su pasado sangriento y buscando un nuevo propósito guiado por la paz.',
    generos: ['Acción', 'Aventura', 'Drama'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1170/124343.jpg',
    anioEstreno: 2023,
  },
  {
    titulo: 'Monster',
    tituloOriginal: 'MONSTER',
    sinopsis: 'El prestigioso neurocirujano Kenzo Tenma salva la vida de un niño huérfano que años después resulta ser un brillante y despiadado sociópata.',
    generos: ['Drama', 'Misterio', 'Psicológico', 'Suspenso'],
    totalEpisodios: 74,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/10/18740.jpg',
    anioEstreno: 2004,
  },
  {
    titulo: 'Berserk (1997)',
    tituloOriginal: '剣風伝奇ベルセルク',
    sinopsis: 'Guts, el implacable espadachín negro, se une a la Banda del Halcón comandada por el carismático Griffith durante la legendaria Edad de Oro.',
    generos: ['Acción', 'Aventura', 'Drama', 'Fantasía'],
    totalEpisodios: 25,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/9/51119.jpg',
    anioEstreno: 1997,
  },
  {
    titulo: 'Hellsing Ultimate',
    tituloOriginal: 'HELLSING OVA',
    sinopsis: 'La Organización Hellsing y su letal vampiro Alucard combaten amenazas sobrenaturales y a un ejército nazi reanimado que busca destruir Londres.',
    generos: ['Acción', 'Sobrenatural'],
    totalEpisodios: 10,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
    anioEstreno: 2006,
  },
  {
    titulo: 'Black Clover',
    tituloOriginal: 'ブラッククローバー',
    sinopsis: 'Asta nació sin pizca de magia en un mundo donde todo depende de ella, pero obtiene un grimorio de cinco hojas con el poder de la antimagia.',
    generos: ['Acción', 'Comedia', 'Fantasía', 'Shounen'],
    totalEpisodios: 170,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/2/88336.jpg',
    anioEstreno: 2017,
  },
  {
    titulo: 'Dr. STONE',
    tituloOriginal: 'ドクターストーン',
    sinopsis: 'La humanidad queda petrificada por miles de años. El joven genio Senku Ishigami despierta y se propone reconstruir la civilización a través de la ciencia.',
    generos: ['Aventura', 'Comedia', 'Ciencia Ficción', 'Shounen'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1613/102576.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Fire Force',
    tituloOriginal: '炎炎ノ消防隊',
    sinopsis: 'Shinra Kusakabe se une a la 8ª Brigada Especial de Bomberos para erradicar la combustión humana espontánea y descubrir la verdad de su pasado.',
    generos: ['Acción', 'Sobrenatural', 'Shounen'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1166/102077.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Blue Lock',
    tituloOriginal: 'ブルーロック',
    sinopsis: 'Trescientos de los mejores delanteros juveniles de Japón son encerrados en una prisión de alta tecnología para forjar al atacante más egoísta del mundo.',
    generos: ['Deportes', 'Drama', 'Shounen'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1258/126929.jpg',
    anioEstreno: 2022,
  },
  {
    titulo: 'JoJo no Kimyou na Bouken (2012)',
    tituloOriginal: 'ジョジョの奇妙な冒険',
    sinopsis: 'La rivalidad ancestral entre Jonathan Joestar y su hermano adoptivo Dio Brando desata un conflicto sobrenatural que abarcará generaciones.',
    generos: ['Acción', 'Aventura', 'Sobrenatural'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/3/40409.jpg',
    anioEstreno: 2012,
  },
  {
    titulo: 'JoJo: Stardust Crusaders',
    tituloOriginal: 'ジョジョの奇妙な冒険 スターダストクルセイダース',
    sinopsis: 'Jotaro Kujo y su abuelo Joseph viajan a Egipto junto a un grupo de usuarios de Stands para eliminar al renacido Dio y salvar la vida de su madre.',
    generos: ['Acción', 'Aventura', 'Sobrenatural'],
    totalEpisodios: 48,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/11/55267.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'JoJo: Golden Wind',
    tituloOriginal: 'ジョジョの奇妙な冒険 黄金の風',
    sinopsis: 'En Italia, Giorno Giovanna se une a la mafia Passione junto a Bruno Bucciarati para reformar la organización desde adentro y proteger a los desvalidos.',
    generos: ['Acción', 'Aventura', 'Sobrenatural'],
    totalEpisodios: 39,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1572/95010.jpg',
    anioEstreno: 2018,
  },
  {
    titulo: 'Erased',
    tituloOriginal: '僕だけがいない街',
    sinopsis: 'Satoru Fujinuma es transportado 18 años al pasado para evitar el secuestro y asesinato de su compañera de clase Kayo Hinazuki.',
    generos: ['Misterio', 'Psicológico', 'Sobrenatural', 'Suspenso'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/10/77957.jpg',
    anioEstreno: 2016,
  },
  {
    titulo: 'The Promised Neverland',
    tituloOriginal: '約束のネバーランド',
    sinopsis: 'Emma, Norman y Ray descubren el oscuro secreto detrás del idílico orfanato Grace Field House y planifican un escape milagroso con sus hermanos.',
    generos: ['Misterio', 'Psicológico', 'Suspenso', 'Shounen'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1125/96929.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Great Teacher Onizuka',
    tituloOriginal: 'GTO',
    sinopsis: 'Eikichi Onizuka, un ex-miembro de una banda de motociclistas de 22 años, decide convertirse en el mejor profesor del mundo rompiendo todas las reglas.',
    generos: ['Comedia', 'Drama', 'Recuentos de la vida'],
    totalEpisodios: 43,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/13/11460.jpg',
    anioEstreno: 1999,
  },
  {
    titulo: 'Samurai Champloo',
    tituloOriginal: 'サムライチャンプルー',
    sinopsis: 'Fuu, una camarera de té, convence al salvaje espadachín Mugen y al estricto ronin Jin para que la acompañen en su búsqueda del samurái que huele a girasoles.',
    generos: ['Acción', 'Aventura', 'Comedia'],
    totalEpisodios: 26,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/11/29134.jpg',
    anioEstreno: 2004,
  },
  {
    titulo: 'Kill la Kill',
    tituloOriginal: 'キルラキル',
    sinopsis: 'Ryuko Matoi busca al asesino de su padre empuñando una media espada tijera en la Academia Honnouji, donde los uniformes otorgan poderes sobrehumanos.',
    generos: ['Acción', 'Comedia', 'Sobrenatural'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1405/138463.jpg',
    anioEstreno: 2013,
  },
  {
    titulo: 'Noragami',
    tituloOriginal: 'ノラガミ',
    sinopsis: 'Yato es un dios menor sin templo que cobra 5 yenes por realizar favores, hasta que conoce a Hiyori Iki, una humana cuya alma se separa de su cuerpo.',
    generos: ['Acción', 'Aventura', 'Comedia', 'Sobrenatural'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/8/77809.jpg',
    anioEstreno: 2014,
  },
  {
    titulo: 'Assassination Classroom',
    tituloOriginal: '暗殺教室',
    sinopsis: 'Los alumnos de la clase 3-E tienen como misión asesinar a su nuevo tutor Koro-sensei, un pulpo alienígena con velocidad Mach 20 que planea destruir la Tierra.',
    generos: ['Acción', 'Comedia', 'Shounen'],
    totalEpisodios: 22,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/5/68789.jpg',
    anioEstreno: 2015,
  },
  {
    titulo: 'Soul Eater',
    tituloOriginal: 'ソウルイーター',
    sinopsis: 'En la Academia Shibusen, los técnicos de armas y sus compañeros que pueden transformarse en armas combaten almas corruptas para forjar una Death Scythe.',
    generos: ['Acción', 'Comedia', 'Fantasía', 'Shounen'],
    totalEpisodios: 51,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/9/7804.jpg',
    anioEstreno: 2008,
  },
  {
    titulo: 'Dororo',
    tituloOriginal: 'どろろ',
    sinopsis: 'Hyakkimaru nace sin extremidades ni sentidos tras el pacto de su padre con 12 demonios. Junto a la ladronzuela Dororo, combate para recuperar su humanidad.',
    generos: ['Acción', 'Aventura', 'Sobrenatural'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1879/100467.jpg',
    anioEstreno: 2019,
  },
  {
    titulo: 'Banana Fish',
    tituloOriginal: 'BANANA FISH',
    sinopsis: 'Ash Lynx, el líder de una pandilla en Nueva York, investiga las enigmáticas palabras "Banana Fish" con la ayuda del fotógrafo japonés Eiji Okumura.',
    generos: ['Acción', 'Aventura', 'Drama', 'Suspenso'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1190/93472.jpg',
    anioEstreno: 2018,
  },
  {
    titulo: 'Horimiya',
    tituloOriginal: 'ホリミヤ',
    sinopsis: 'Kyouko Hori y Izumi Miyamura descubren las facetas secretas que ambos esconden en la escuela, comenzando una tierna y cómica amistad.',
    generos: ['Comedia', 'Romance', 'Recuentos de la vida'],
    totalEpisodios: 13,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1695/111486.jpg',
    anioEstreno: 2021,
  },
  {
    titulo: 'Classroom of the Elite',
    tituloOriginal: 'ようこそ実力至上主義の教室へ',
    sinopsis: 'Kiyotaka Ayanokouji oculta su verdadero intelecto supremo en la prestigiosa Escuela Metropolitana Avanzada de Tokio, compitiendo desde la clase D.',
    generos: ['Drama', 'Psicológico'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/5/86830.jpg',
    anioEstreno: 2017,
  },
  {
    titulo: 'Trigun Stampede',
    tituloOriginal: 'TRIGUN STAMPEDE',
    sinopsis: 'Vash the Stampede, apodado el Tifón Humanoide, cruza el desértico planeta No Man\'s Land huyendo de cazarrecompensas mientras predica la no violencia.',
    generos: ['Acción', 'Aventura', 'Ciencia Ficción'],
    totalEpisodios: 12,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1301/130635.jpg',
    anioEstreno: 2023,
  },
  {
    titulo: 'D.Gray-man',
    tituloOriginal: 'ディー・グレイマン',
    sinopsis: 'Allen Walker es un exorcista de la Orden Negra que combate las armas mecánicas Akuma creadas por el Conde del Milenio usando su brazo parásito Inocencia.',
    generos: ['Acción', 'Aventura', 'Sobrenatural', 'Shounen'],
    totalEpisodios: 103,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/12/8456.jpg',
    anioEstreno: 2006,
  },
  {
    titulo: 'Kuroshitsuji (Black Butler)',
    tituloOriginal: '黒執事',
    sinopsis: 'El joven conde Ciel Phantomhive investiga misterios para la Reina de Inglaterra acompañado por Sebastian Michaelis, un mayordomo demoníaco a su servicio.',
    generos: ['Acción', 'Misterio', 'Sobrenatural'],
    totalEpisodios: 24,
    estadoEmision: 'Finalizado',
    imagenPortada: 'https://cdn.myanimelist.net/images/anime/1979/140733.jpg',
    anioEstreno: 2008,
  }
];

async function sembrar50Animes() {
  console.log('🚀 Iniciando inserción de 55 nuevos animes...');
  await conectarDB();

  // 1. Asegurar géneros
  const generosSet = new Set(LISTA_55_ANIMES.flatMap(a => a.generos));
  for (const g of generosSet) {
    const existe = await Genero.findOne({ nombre: new RegExp(`^${g}$`, 'i') });
    if (!existe) {
      await Genero.create({ nombre: g });
    }
  }

  // 2. Insertar Animes
  let insertados = 0;
  const animesInsertados = [];
  for (const a of LISTA_55_ANIMES) {
    const existe = await Anime.findOne({ titulo: new RegExp(`^${a.titulo}$`, 'i') });
    if (!existe) {
      const nuevo = await Anime.create(a);
      animesInsertados.push(nuevo);
      insertados++;
    }
  }
  console.log(`✅ Series agregadas al catálogo: ${insertados} animes nuevos.`);

  // 3. Vincular con los usuarios existentes para agregar seguimientos y reseñas
  const usuarios = await Usuario.find();
  const todosAnimes = await Anime.find();

  console.log(`👥 Distribuyendo seguimientos y reseñas entre ${usuarios.length} usuarios...`);

  let nuevosSegs = 0;
  let nuevasRes = 0;

  for (const anime of animesInsertados) {
    // 6 a 12 usuarios siguen este anime
    const cantidadSeguidores = Math.floor(Math.random() * 7) + 6;
    const usuariosRandom = [...usuarios].sort(() => 0.5 - Math.random()).slice(0, cantidadSeguidores);

    for (const u of usuariosRandom) {
      const existeSeg = await Seguimiento.findOne({ usuario_id: u._id, anime_id: anime._id });
      if (!existeSeg) {
        const estados = ['Viendo', 'Completado', 'Pendiente'];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        const total = anime.totalEpisodios || 12;
        const ep = estado === 'Completado' ? total : estado === 'Viendo' ? Math.max(1, Math.floor(Math.random() * total)) : 0;

        await Seguimiento.create({
          usuario_id: u._id,
          anime_id: anime._id,
          estado,
          episodioActual: ep,
        });
        nuevosSegs++;
      }
    }

    // 3 a 6 usuarios dejan reseña
    const cantidadResenas = Math.floor(Math.random() * 4) + 3;
    const usuariosResena = [...usuariosRandom].slice(0, cantidadResenas);

    const textos = [
      'Una experiencia inolvidable. Superó todas mis expectativas.',
      'Excelente banda sonora, animación fluida y momentos de tensión increíbles.',
      'Personajes muy carismáticos y una trama que no te deja pestañear.',
      'De lo mejor que vi en mucho tiempo. Totalmente recomendado.',
      'Buen ritmo de narración, sin capítulos de relleno innecesarios.'
    ];

    for (const u of usuariosResena) {
      const existeRes = await Resena.findOne({ usuario_id: u._id, anime_id: anime._id });
      if (!existeRes) {
        const calificacion = [8, 9, 10, 7, 8, 9, 10][Math.floor(Math.random() * 7)];
        await Resena.create({
          usuario_id: u._id,
          anime_id: anime._id,
          calificacion,
          texto: textos[Math.floor(Math.random() * textos.length)],
          spoiler: Math.random() < 0.15,
        });
        nuevasRes++;
      }
    }

    // Recalcular métricas de este anime
    const [resumen] = await Resena.aggregate([
      { $match: { anime_id: anime._id } },
      { $group: { _id: '$anime_id', promedio: { $avg: '$calificacion' }, total: { $sum: 1 } } }
    ]);
    const prom = resumen ? Math.round(resumen.promedio * 10) / 10 : 0;
    const tot = resumen ? resumen.total : 0;
    await Anime.findByIdAndUpdate(anime._id, { $set: { calificacionPromedio: prom, totalResenas: tot } });
  }

  const finalAnimes = await Anime.countDocuments();
  const finalSegs = await Seguimiento.countDocuments();
  const finalRes = await Resena.countDocuments();

  console.log('\n======================================================');
  console.log('🎉 ¡NUEVOS 55 ANIMES INSERTADOS Y VINCULADOS CON ÉXITO!');
  console.log(`- Total animes en catálogo: ${finalAnimes}`);
  console.log(`- Total seguimientos en bibliotecas: ${finalSegs}`);
  console.log(`- Total reseñas registradas: ${finalRes}`);
  console.log('======================================================\n');
}

try {
  await sembrar50Animes();
} catch (err) {
  console.error('Error:', err);
} finally {
  await mongoose.disconnect();
}
