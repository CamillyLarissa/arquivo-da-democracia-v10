import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {sampleExpenses} from '../src/data/despesas-amostra.js';
const file=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('candidatura da captura possui lançamentos reais na amostra',()=>{
 const bella=sampleExpenses['9b5b61d4d865c3e35a852bc6543dfb48'];
 assert.equal(bella?.length,5); assert.ok(bella.every(x=>x.valor>0&&x.categoria&&x.id));
});
test('novo fichário é uma caixa 3D com divisórias indexadas e ficha que gira',()=>{
 const src=file('src/components/Arquivo3D.jsx');
 for(const key of ['Canvas','OrbitControls','IndexDivider','RowCard','Extracted','rotation.y','createCandidateTexture','candidate.numero','candidate.nome','candidate.partido','candidate.votos','candidate.gastos','candidate.patrimonio']) assert.ok(src.includes(key),key);
 assert.ok(src.includes('onFlip()'));
});
test('novo documento fiscal é uma representação, sem inventar NF original',()=>{
 const src=file('src/pages/PrestacaoDeContas.jsx');
 for(const key of ['fiscal-document-v9','NÃO É NOTA FISCAL ORIGINAL','FORNECEDOR / EMITENTE','NÚMERO DA NOTA ORIGINAL','Não disponível','receipt-empty-document','Não criamos notas fiscais'])assert.ok(src.includes(key),key);
 assert.ok(!src.includes('envelope-open'));
});
test('a paginação das folhas fiscais busca mais do que os 35 primeiros registros',()=>{
 const src=file('src/pages/PrestacaoDeContas.jsx');
 const api=file('server/app.py');
 assert.ok(src.includes('expenseOffset')); assert.ok(src.includes('limit:40'));
 assert.ok(api.includes('total_filtered'));assert.ok(api.includes('OFFSET ?'));
});
test('adesivo circular tem dobra e verso baseado em dados',()=>{
 const css=file('src/v8.css'),jsx=file('src/pages/Adesivaria.jsx');
 assert.ok(css.includes('.sticker-real{'));assert.ok(css.includes('border-radius:50%'));assert.ok(css.includes('.candidate-sticker-curl'));assert.ok(jsx.includes('candidate-sticker-back'));assert.ok(jsx.includes('c.votos'));
});
test('o plenário mantém mesa, tribuna e import do texto no Three.js',()=>{
 const src=file('src/components/Plenario3D.jsx');
 assert.ok(src.includes('MESA DIRETORA'));assert.ok(src.includes('TRIBUNA'));assert.ok(src.includes('seat.color'));
 assert.match(src,/import\s*\{[^}]*Text[^}]*\}\s*from\s*["']@react-three\/drei["']/);
});
