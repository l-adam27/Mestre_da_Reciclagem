/**
 * Configuração de Imagens para Mestre da Reciclagem
 * 
 * Este arquivo mapeia todos os caminhos de imagens usadas no jogo.
 * Para usar imagens personalizadas, coloque os arquivos PNG na pasta IMAGENS/
 * e atualize os caminhos abaixo.
 * 
 * IMAGENS PODEM SER DE QUALQUER TAMANHO! O jogo redimensiona automaticamente.
 * Recomendado: 500x800px para lixeiras, 300x300px para itens
 * 
 * Estrutura esperada:
 * IMAGENS/
 * ├── bins/
 * │   ├── paper.png       (Lixeira de Papel - Azul)
 * │   ├── plastic.png     (Lixeira de Plástico - Vermelho)
 * │   ├── glass.png       (Lixeira de Vidro - Verde)
 * │   ├── metal.png       (Lixeira de Metal - Amarelo)
 * │   ├── organic.png     (Lixeira de Orgânico - Marrom)
 * │   └── survival.png    (Lixeira de Sobrevivência)
 * └── items/
 *     ├── paper.png       (Item Papel)
 *     ├── plastic.png     (Item Plástico/Garrafa PET)
 *     ├── glass.png       (Item Vidro/Garrafa)
 *     ├── metal.png       (Item Metal/Lata)
 *     └── organic.png     (Item Orgânico/Casca de Fruta)
 */

const ImageConfig = {
    // Imagens das lixeiras
    // Tamanho recomendado: 500x800px (serão redimensionadas para 80x60 no jogo)
    bins: {
        paper: 'IMAGENS/bins/paper.png',
        plastic: 'IMAGENS/bins/plastic.png',
        glass: 'IMAGENS/bins/glass.png',
        metal: 'IMAGENS/bins/metal.png',
        organic: 'IMAGENS/bins/organic.png',
        survival: 'IMAGENS/bins/survival.png'
    },
    
    // Imagens dos itens (lixos)
    // Tamanho recomendado: 300x300px (serão redimensionadas para 40x40 no jogo)
    items: {
        paper: 'IMAGENS/items/paper.png',
        plastic: 'IMAGENS/items/plastic.png',
        glass: 'IMAGENS/items/glass.png',
        metal: 'IMAGENS/items/metal.png',
        organic: 'IMAGENS/items/organic.png'
    },
    
    // Tamanhos de exibição final (redimensionadas automaticamente)
    displaySizes: {
        bins: { width: 90, height: 90 },      // Tamanho final da lixeira
        items: { width: 60, height: 60
         }      // Tamanho final do item
    },
    
    // Controlar se usa imagens ou desenho programático
    useImages: true  // Mude para true quando tiver as imagens
};

// Cache de imagens carregadas
const ImageCache = {};

/**
 * Carrega uma imagem de forma assíncrona
 * @param {string} src - Caminho da imagem
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (ImageCache[src]) {
            resolve(ImageCache[src]);
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            ImageCache[src] = img;
            resolve(img);
        };
        img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
        img.src = src;
    });
}

/**
 * Carrega todas as imagens necessárias
 * @returns {Promise<void>}
 */
async function preloadImages() {
    if (!ImageConfig.useImages) return;
    
    const allPaths = [
        ...Object.values(ImageConfig.bins),
        ...Object.values(ImageConfig.items)
    ];
    
    try {
        await Promise.all(allPaths.map(path => loadImage(path)));
        console.log('✅ Todas as imagens carregadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar imagens:', error);
        console.warn('Alterando para modo de desenho programático...');
        ImageConfig.useImages = false;
    }
}

/**
 * Desenha uma imagem redimensionada se disponível, caso contrário usa fallback
 * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
 * @param {string} src - Caminho da imagem
 * @param {number} x - Posição X (centro)
 * @param {number} y - Posição Y (canto superior esquerdo para bins, centro para items)
 * @param {number} finalWidth - Largura final desejada
 * @param {number} finalHeight - Altura final desejada
 * @param {boolean} isBin - Se é uma lixeira (diferente posicionamento)
 * @param {Function} fallbackFn - Função de desenho alternativa
 */
function drawImageOrFallback(ctx, src, x, y, finalWidth, finalHeight, isBin, fallbackFn) {
    if (!ImageConfig.useImages || !ImageCache[src]) {
        if (fallbackFn) fallbackFn();
        return;
    }
    
    const img = ImageCache[src];
    
    if (isBin) {
        // Para lixeiras: desenhar a partir do centro X, canto superior Y
        ctx.drawImage(img, x - finalWidth / 2, y, finalWidth, finalHeight);
    } else {
        // Para itens: desenhar a partir do centro
        ctx.drawImage(img, x - finalWidth / 2, y - finalHeight / 2, finalWidth, finalHeight);
    }
}

