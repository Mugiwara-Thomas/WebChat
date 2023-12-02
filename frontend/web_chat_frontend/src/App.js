import { Button } from '@mui/material';
import { IconButton } from '@mui/material';
import { TextField } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PhoneIcon from '@mui/icons-material/Phone';
import React, { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Peer from 'simple-peer';
import io from 'socket.io-client';

import './App.css';

// TODO: env
const socket = io.connect('https://webchat-server-0dde.onrender.com')
function App() {
  const [meuId, setMeuID] = useState("")
  const [stream, setStream] = useState()
  const [recebendoChamada, setRecebendoChamada] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [chamadaAceita, setChamadaAceita] = useState(false)
  const [idToCall, setIdToCall] = useState("")
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState("")
  
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  useEffect(() => {
    // ? Pedir Permissão para usar o vídeo e áudio do navegador
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream)
      setTimeout(() => {
        myVideo.current.srcObject = stream
      }, 2000)
    })

    // ? Perguntando para o server o meu id e setando ele
    socket.on("me", (id) => {
      setMeuID(id)
    })

    // ? Pedindo para o servidor para chamar o usuário, e setando as informações
    socket.on("callUser", (data) => {
      setRecebendoChamada(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])


  const ligar = (id) => {
    // ? Cria novo peer
    const peer = new Peer({
      initiator: true, // * Define quem está iniciando a chamada
      trickle: false,
      stream: stream
    })
    // * Envia um sinal para o peer com a data
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: meuId,
        name: name
      })
    })

    // * Separa onde o vídeo do usuário vai ficar
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })

    // * Envia um sinal para o socket que a chamad afoi aceita e muda o referencial de conexão
    socket.on("callAccepted", (signal) => {
      setChamadaAceita(true)
      peer.signal(signal)
    })
    connectionRef.current = peer
  }

  // ? Função para responder uma ligação
  const responder = () => {
    setChamadaAceita(true)

    // * Cria um Peer para si
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })

    // * Envia um sinal para o socket responder a chamada
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller })
    })
    
    // * Define onde o vídeo vai aparecer
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })

    // * Seta o sinal para ser o do remetente, assim estabelecendo uma conexão
    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const sairDaChamada = () => {
    setCallEnded(true)
    connectionRef.current.destroy()

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <>
      <h1 style={{ textAlign: "center", color: '#fff' }}>WebChat</h1>
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
          </div>
          <div className="video">
            {chamadaAceita && !callEnded ?
              <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} /> :
              null}
          </div>
        </div>
        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard text={meuId} style={{ marginBottom: "2rem" }}>
            <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
              Copiar ID
            </Button>
          </CopyToClipboard>

          <TextField
            id="filled-basic"
            label="ID to call"
            variant="filled"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
            {chamadaAceita && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={sairDaChamada}>
                End Call
              </Button>
            ) : (
              <IconButton color="primary" aria-label="call" onClick={() => ligar(idToCall)}>
                <PhoneIcon fontSize="large" />
              </IconButton>
            )}
            {idToCall}
          </div>
        </div>
        <div>
          {recebendoChamada && !chamadaAceita ? (
            <div className="caller">
              <h1 >{name} está ligando...</h1>
              <Button variant="contained" color="primary" onClick={responder}>
                Responder
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default App